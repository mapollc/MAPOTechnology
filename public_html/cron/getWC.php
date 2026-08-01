<?
ini_set('display_errors', 1);
error_reporting(E_ALL);

include_once '/home/mapo/public_html/cron/dispatch.inc.php';

class GetWildCAD
{
    // Comment: Reduced concurrency to be gentler on the API
    private const MAX_CONCURRENT = 3;
    private const MAX_RETRIES = 3;

    private $multi;

    private $dispatchCenters;
    private $queue = [];
    private $handles = [];
    private $results = [];
    private $retries = [];

    public function __construct($dispatchCenters)
    {
        $this->dispatchCenters = $dispatchCenters;
    }

    public function fetch()
    {
        $this->multi = curl_multi_init();

        foreach ($this->dispatchCenters as $center) {
            $this->queue[] = [
                'center' => $center,
                'ready' => microtime(true)
            ];

            $this->retries[$center] = 0;
        }

        $this->run();

        curl_multi_close($this->multi);
    }

    private function run()
    {
        do {
            $this->startRequests();

            do {
                $status = curl_multi_exec($this->multi, $running);
            } while ($status === CURLM_CALL_MULTI_PERFORM);

            $this->collectResponses();

            if ($running) {
                if (function_exists('curl_multi_wait')) {
                    curl_multi_wait($this->multi, 1.0);
                } else {
                    curl_multi_select($this->multi, 1.0);
                }
            } else if (!empty($this->queue)) {
                $next = $this->queue[0]['ready'] - microtime(true);

                if ($next > 0) {
                    usleep((int) min($next * 1000000, 500000));
                }
            }
        } while ($running || !empty($this->queue));
    }

    private function startRequests()
    {
        while (count($this->handles) < self::MAX_CONCURRENT && !empty($this->queue)) {
            $job = $this->queue[0];

            // not ready yet
            if ($job['ready'] > microtime(true)) {
                break;
            }

            array_shift($this->queue);

            $center = $job['center'];

            if ($this->retries[$center] === 0) echo "Retrieving CAD data for {$center}" . PHP_EOL;

            $ch = $this->createHandle($center);

            curl_multi_add_handle($this->multi, $ch);

            $this->handles[spl_object_id($ch)] = [
                'center' => $center,
                'handle' => $ch
            ];

            usleep(random_int(50000, 150000));
        }
    }

    private function collectResponses()
    {
        while ($info = curl_multi_info_read($this->multi)) {
            $ch = $info['handle'];

            $job = $this->handles[(int)$ch];
            $center = $job['center'];

            $curlResult = $info['result'];
            //curlError = curl_error($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);

            $json = $this->processResponse($ch);

            curl_multi_remove_handle($this->multi, $ch);
            curl_close($ch);

            unset($this->handles[(int)$ch]);

            if ($json !== null) {
                $this->results[$center] = $json;
                continue;
            }

            $transient = $curlResult !== CURLE_OK || in_array($httpCode, [408, 429, 500, 502, 503, 504], true);

            if ($transient) {
                $this->retry($center);
            } else {
                $this->results[$center] = null;
            }
        }
    }

    private function retry($center)
    {
        if ($this->retries[$center] >= self::MAX_RETRIES) {
            $this->results[$center] = null;
            echo "FAILED: {$center}" . PHP_EOL;

            return;
        }

        $this->retries[$center]++;

        $delay = 1 << ($this->retries[$center] - 1); // 1,2,4 seconds

        echo "Retry #{$this->retries[$center]} for {$center} in {$delay}s" . PHP_EOL;

        $this->queue[] = [
            'center' => $center,
            'ready'  => microtime(true) + $delay + mt_rand(0, 500) / 1000
        ];

        usort(
            $this->queue,
            static fn($a, $b) =>
            $a['ready'] <=> $b['ready']
        );
    }

    private function createHandle($center)
    {
        $ch = curl_init("https://snknmqmon6.execute-api.us-west-2.amazonaws.com/centers/$center/incidents");

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_ENCODING => "",
            CURLOPT_FOLLOWLOCATION => true,
            // Comment: Let libcurl negotiate the best protocol
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_NONE,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
        ]);

        return $ch;
    }

    private function processResponse($ch)
    {
        if (curl_errno($ch)) {
            return null;
        }

        if (curl_getinfo($ch, CURLINFO_RESPONSE_CODE) !== 200) {
            return null;
        }

        $body = curl_multi_getcontent($ch);

        $json = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE || !isset($json[0])) {
            return null;
        }

        return json_encode(
            $json[0],
            JSON_UNESCAPED_SLASHES
        );
    }

    public function save(): void
    {
        foreach ($this->results as $center => $json) {

            if ($json === null) {
                echo "Failed updating CAD data for {$center}" . PHP_EOL;
                continue;
            }

            $this->backup($center);

            file_put_contents(
                "./cache/run1/{$center}.json",
                $json,
                LOCK_EX
            );

            echo "Updated CAD data for {$center}" . PHP_EOL;
        }
    }

    private function backup(string $center): bool
    {
        $run1 = "./cache/run1/{$center}.json";
        $run2 = "./cache/run2/{$center}.json";

        if (!file_exists($run1)) {
            return false;
        }

        $mtime = filemtime($run1);

        if (file_exists($run2)) {
            unlink($run2);
        }

        if (!rename($run1, $run2)) {
            return false;
        }

        touch($run2, $mtime);

        return true;
    }
}

echo '========== Started getting WildCAD data ========== ' . PHP_EOL;

$fetcher = new GetWildCAD($newDispatchCenters);

$fetcher->fetch();
$fetcher->save();

echo '========== Finished getting WildCAD data ========== ' . PHP_EOL;