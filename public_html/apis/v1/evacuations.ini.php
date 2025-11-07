<?
function getStructures($coords)
{

    $geo = [
        'spatialReference' => [
            'wkid' => 4326,
            'latestWkid' => 4326
        ],
        'rings' => $coords->coordinates
    ];
    $geometry = urlencode(json_encode($geo));

    $pop = 0;
    $structures = 0;
    $data = json_decode(file_get_contents("https://services2.arcgis.com/FiaPA4ga0iQKduv3/arcgis/rest/services/USA_Structures_View/FeatureServer/0/query?where=1%3D1&objectIds=&geometry=$geometry&geometryType=esriGeometryPolygon&inSR=4326&spatialRel=esriSpatialRelContains&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=OCC_CLS%2CCOUNT%28OCC_CLS%29+AS+structures&returnGeometry=false&returnCentroid=false&returnEnvelope=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&geometryPrecision=&outSR=4326&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&groupByFieldsForStatistics=OCC_CLS&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&sqlFormat=none&f=json"));

    foreach ($data->features as $feat) {
        $structures += $feat->attributes->structures;
        if ($feat->attributes->OCC_CLS == 'Residential') {
            $pop += $feat->attributes->structures;
        }
    }

    return [
        'structures' => $structures,
        'population' => round($pop * 2.55, 1)
    ];
}


function evacCA()
{
    $evac = [];
    $cali = json_decode(file_get_contents('https://services.arcgis.com/BLN4oKB0N1YSgvY8/arcgis/rest/services/CA_EVACUATIONS_CalOESHosted_view/FeatureServer/0/query?geometryPrecision=6&outFields=*&where=1%3D1&f=geojson'))->features;

    for ($i = 0; $i < count($cali); $i++) {
        $e = $cali[$i]->properties;
        $level = $e->STATUS == 'Evacuation Order' ? '3' : ($e->STATUS == 'Evacuation Warning' ? '2' : '1');
        $prop = ['id' => $e->OBJECTID, 'state' => 'CA', 'county' => ucwords(strtolower($e->COUNTY)), 'level' => $level, 'notes' => $e->NOTES, 'zoneID' => $e->ZONE_ID, 'updated' => round($e->EditDate / 1000)];

        $evac[] = array('id' => $e->OBJECTID, 'type' => 'Feature', 'geometry' => $cali[$i]->geometry, 'properties' => $prop);
    }

    return $evac;
}

function evacOR()
{
    $evac = [];
    $ore = json_decode(file_get_contents('https://services.arcgis.com/uUvqNMGPm7axC2dD/ArcGIS/rest/services/Fire_Evacuation_Areas_Public/FeatureServer/0/query?geometryPrecision=6&outFields=OBJECTID%2CEvac_Area_Name%2CStructuresWithin%2CAddressesWithin%2CPopulationWithin%2CCounty%2CFire_Evacuation_Level%2Clast_edited_date&where=1%3D1&f=geojson'))->features;

    for ($i = 0; $i < count($ore); $i++) {
        $e = $ore[$i]->properties;
        $notes = "Evac Zone Name: $e->Evac_Area_Name / Structures: $e->StructuresWithin / Addresses: $e->AddressesWithin / Population: $e->PopulationWithin";
        $prop = ['id' => $e->OBJECTID, 'state' => 'OR', 'county' => $e->County, 'level' => $e->Fire_Evacuation_Level, 'notes' => $notes, 'updated' => round($e->last_edited_date / 1000)];
        $evac[] = array('id' => $e->OBJECTID, 'type' => 'Feature', 'geometry' => $ore[$i]->geometry, 'properties' => $prop);
    }

    return $evac;
}

if ($_GET['test'] == 1) {
    $evacuations = [];
    $states = ['OR', 'WA', 'CA'];

    for ($i = 0; $i < count($states); $i++) {
        $fileName = '/home/mapo/public_html/cron/cache/evacs_' . $states[$i] . '.json';

        if (file_exists($fileName)) {
            $arr = json_decode(file_get_contents($fileName), true);

            if (count($arr) > 0) {
                $evacuations = array_merge($arr, $evacuations);
            }
        }
    }

    usort($evacuations, function ($a, $b) {
        $levelA = $a['properties']['level'];
        $levelB = $b['properties']['level'];

        if ($levelA !== $levelB) {
            return $levelB <=> $levelA;
        }

        $updatedA = $a['properties']['updated'];
        $updatedB = $b['properties']['updated'];

        return $updatedB <=> $updatedA;
    });

    $returnJson = array('type' => 'FeatureCollection', 'features' => $evacuations ? $evacuations : null);
} else {
    $cachefilename = 'evacuations';
    $memcache = new Memcached();
    $memcache->addServer('127.0.0.1', 11211);
    $cache = $memcache->get($cachefilename);

    if (!$cache || ((time() - $memcache->get($cachefilename . '-time')) > 450) || (filemtime(root() . 'evacuations.ini.php') > $memcache->get($cachefilename . '-time'))) {
        $evac = [];
        $california = evacCA();
        $oregon = evacOR();

        if (count($california) > 0) {
            $evac = array_merge($california, $evac);
        }

        if (count($oregon) > 0) {
            $evac = array_merge($oregon, $evac);
        }

        usort($evac, function ($a, $b) {
            $levelA = $a['properties']['level'];
            $levelB = $b['properties']['level'];

            if ($levelA !== $levelB) {
                return $levelB <=> $levelA;
            }

            $updatedA = $a['properties']['updated'];
            $updatedB = $b['properties']['updated'];

            return $updatedB <=> $updatedA;
        });

        $returnJson = array('type' => 'FeatureCollection', 'features' => $evac ? $evac : null);
        $memcache->set($cachefilename, json_encode($returnJson), 450);
        $memcache->set($cachefilename . '-time', time(), 450);
    } else {
        $isCached = true;
        $cache = json_decode($cache);
        $returnJson = $cache;
    }
}
