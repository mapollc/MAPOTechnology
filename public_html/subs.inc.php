<?
//$stripeLive = $stripeLive ? $stripeLive : false;
$trialPeriod = 7;

class ManageSubs {
    public $plan;
    public $name;
    public $selected;

    public function __construct() {
        $this->name = null;
        $this->selected = null;
        $this->plan = [
            [
                'id' => 1,
                'product' => '',
                'name' => 'Map of Fire: LOOKOUT',
                'price' => 0,
                'price_id' => [
                    [
                        'name' => 'lookout'
                    ]
                ]
            ],
            [
                'id' => 2,
                'product' => 'prod_SeguW9sYTc3MZ1',
                'name' => 'Map of Fire: IGNITE',
                'price' => 9.99,
                'price_id' => [
                    [
                        'id2' => 'price_1RjNWnIqEsGXsIu3qZOIBePm',  // demo ID
                        'id' => 'price_1S5wS0IpCdpJm6cTpwnzyepq',
                        'name' => 'ignite_monthly',
                        'term' => 1,
                        'discount' => 0
                    ]
                ]
            ],
            [
                'id' => 3,
                'product' => 'prod_SegwXXyeCediJy',
                'name' => 'Map of Fire: HOTSHOT',
                'price' => 19.99,
                'price_id' => [
                    [
                        'id2' => 'price_1RjNYYIqEsGXsIu3krvH7APQ',  // demo ID
                        'id' => 'price_1S5wS9IpCdpJm6cTeR2vbvCR',
                        'name' => 'hotshot_monthly',
                        'term' => 1,
                        'discount' => 0
                    ],
                    [
                        'id2' => 'price_1Rn4MvIqEsGXsIu35k3xLafb',  // demo ID
                        'id' => 'price_1S5wS9IpCdpJm6cT8Ou0Mewj',
                        'name' => 'hotshot_annual',
                        'term' => 12,
                        'discount' => 0.1
                    ]
                ]
            ]
        ];
    }

    public function allPlans() {
        return $this->plan;
    }

    public function isPlan($id) {
        foreach ($this->plan as $plans) {
            foreach ($plans['price_id'] as $pid) {
                $ids[] = $pid['id'];
            }
        }

        return in_array($id, $ids);
    }

    public function setPlan($name, $id = null) {
        if ($id == null) {
            $this->name = $name;
            $this->selected = $this->getPlan();
        } else {
            $this->selected = $this->getPlanByID($id);
        }

        return $this;
    }

    private function getPlanByID($id) {
        foreach ($this->plan as $item) {
            foreach ($item['price_id'] as $prices) {
                if ($prices['id'] == $id) {
                    $piece = $item;
                    unset($piece['price_id']);

                    $this->name = $prices['name'];

                    return [
                        'details' => $piece,
                        'pricing' => $prices
                    ];
                }
            }
        }

        return null;
    }

    private function getPlan() {
        foreach ($this->plan as $item) {
            foreach ($item['price_id'] as $prices) {
                if ($prices['name'] == $this->name) {
                    $piece = $item;
                    unset($piece['price_id']);

                    return [
                        'details' => $piece,
                        'pricing' => $prices
                    ];
                }
            }
        }

        return null;
    }

    public function getPriceID() {
        //global $_GET;

        /*if ($_GET['devel'] == 1) {
            return $this->selected['pricing']['id2'];
        } else {*/
            return $this->selected['pricing']['id'];
        //}
    }

    public function getPrice() {
        return $this->selected['details']['price'];
    }

    public function getTotalPrice() {
        return number_format($this->selected['details']['price'] * $this->selected['pricing']['term'], 2);
    }

    public function getName() {
        return $this->selected['details']['name'];
    }

    public function getTerm() {
        return $this->selected['pricing']['term'] == 1 ? 'month' : 'year';
    }

    public function getPriceName() {
        return $this->selected['pricing']['name'];
    }
}

$plan = new ManageSubs();

$mapoSubscriptions = array(
    'donate' => [
        'type' => 'donate',
        'name' => 'Donate',
        'test' => 'price_1MgbasIpCdpJm6cTIvyPmz5C',
        'live' => 'price_1MgyLjIpCdpJm6cT9D5pnE9C'
    ],
    'mfdonate' => [
        'type' => 'donate',
        'name' => 'Map of Fire Donate',
        'test' => 'price_1MgbasIpCdpJm6cTIvyPmz5C',
        'live' => 'price_1PgsdhIpCdpJm6cTHdP3veWh'
    ],
    'mapofire' => [
        'type' => 'paid',
        'name' => 'Map of Fire Premium',
        'test' => 'price_1MgxhSIpCdpJm6cTaKp2dqf5',
        'live' => 'price_1MvPv5IpCdpJm6cTU7NyYnyP',
        'perks' => [
            'Get access to archived, historical wildfire information',
            'Report new wildfire incidents to be published on the map',
            'Buy a coffee for us to continue releasing app updates'
        ],
        'price' => 5.99,
        'term' => 'mo'
    ],
    'mapotrails' => [
        'type' => 'paid',
        'name' => 'Map of Trails Premium',
        'test' => 'price_1NmiH6IpCdpJm6cTP1rELzPw',
        'live' => 'price_1NmlJmIpCdpJm6cTexK8QJNT',
        'perks' => [
            'Add custom tracks, polygons, and waypoints to the map',
            'Upload your own tracks',
            'Calculate valuable statistics for your GIS data'
        ],
        'price' => 5.99,
        'term' => 'mo'
    ],
    'oregonroads' => [
        'type' => 'paid',
        'name' => 'OregonRoads Premium',
        'test' => 'price_1OcYB3IpCdpJm6cTvstK4y8N',
        'live' => 'price_1OcY8LIpCdpJm6cT7zCxwKi4',
        'perks' => [
            'Access to pavement/road temperatures</li>',
            'Access to road surface friction (grip)',
            'Get notified of road closures nearby to you',
            'Report road hazards for all app users to see (future product)'  
        ],
        'price' => 6.99,
        'term' => 'mo'
    ]
);