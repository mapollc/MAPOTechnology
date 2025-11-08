<?
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

function evacChelanCoWA() {
    $evac = [];
    $json = json_decode(file_get_contents('https://services6.arcgis.com/kL9uP9rflLEjUDsy/ArcGIS/rest/services/Emergency_Management_Layers_View/FeatureServer/2/query?geometryPrecision=6&outFields=OBJECTID%2CTypeSpn%2Clast_edited_date&where=1%3D1&f=geojson'))->features;

    for ($i = 0; $i < count($json); $i++) {
        $e = $json[$i]->properties;
        $prop = ['id' => $e->OBJECTID, 'state' => 'WA', 'county' => 'Chelan', 'level' => $e->TypeSpn, 'notes' => '', 'updated' => round($e->last_edited_date / 1000)];
        $evac[] = array('id' => $e->OBJECTID, 'type' => 'Feature', 'geometry' => $json[$i]->geometry, 'properties' => $prop);
    }

    return $evac;
}

function evacWA() {
    return evacChelanCoWA();
}

$states = ['CA', 'OR', 'WA'];
$functions = [evacCA(), evacOR(), evacWA()];

for ($i = 0; $i < count($states); $i++) {
    echo 'Starting ' . $states[$i].' evacuations...
';
    $data = json_encode($functions[$i]);
    
    $file = fopen('./cache/evacs_' . $states[$i] . '.json', 'w');
    fwrite($file, $data);
    fclose($file);

    echo 'Finished with ' . $states[$i].' evacuations...
';
}

echo 'Evacuation JSON data has been completed...
';