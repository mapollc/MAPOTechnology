<?
require '/home/mapo/aws/aws-autoloader.php';
require '/home/mapo/aws-credentials.inc.php';

use Aws\S3\S3Client;

function startS3()
{
    $s3 = S3Client::factory(array(
        'version' => 'latest',
        'region'  => 'us-west-2',
        'credentials' => [
            'key' => $awsKey,
            'secret' => $awsSecret,
        ]
    ));

    return $s3;
}

function awsExists($key)
{
    $s3 = startS3();
    $response = $s3->doesObjectExist('fwac', $key);
    return $response;
}

function renameAWS($folder, $file, $newname)
{
    $s3 = startS3();
    $result = $s3->copyObject([
        'Bucket' => 'fwac',
        'Key' => $folder . '/' . $newname,
        'ACL' => 'public-read',
        'CopySource' => 'fwac/' . $folder . '/' . $file,
    ]);

    return true;
}

function getFromAWS($folder, $file)
{
    $s3 = startS3();
    $status = $s3->doesObjectExist('fwac', $folder . '/' . $file);
    if ($status) {
        try {
            $s3->getObject([
                'Bucket' => 'fwac',
                'Key' => $folder . '/' . $file,
            ]);

            return $result;
        } catch (S3Exception $e) {
            return $e->getMessage() . "\n";
        }
    } else {
        return false;
    }
}

function getAWSFiles($c, $y, $m, $d)
{
    $s3 = startS3();
    $objects = $s3->listObjects([
        'Bucket' => 'fwac',
        'Prefix' => 'webcams/' . $c . '/' . $y . '/' . $m . '/' . $d
    ]);

    foreach ($objects['Contents'] as $object) {
        $files[] = $object['Key'];
    }

    return $files;
}

function saveToAWS($folder, $file, $content_type, $text)
{
    $s3 = startS3();
    try {
        $s3->putObject([
            'Bucket' => 'fwac',
            'ACL' => 'public-read',
            'ContentType' => $content_type,
            'Key' => $folder . '/' . $file,
            'Body' => $text
        ]);

        return false;
    } catch (S3Exception $e) {
        return $e->getMessage() . "\n";
    }
}

function createAWSFolder($folder)
{
    $s3 = startS3();
    try {
        $s3->putObject([
            'Bucket' => 'fwac',
            'ACL' => 'public-read',
            'Body' => '',
            'Key' => $folder
        ]);

        return false;
    } catch (S3Exception $e) {
        return $e->getMessage() . "\n";
    }
}
