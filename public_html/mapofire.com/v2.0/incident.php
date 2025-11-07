<?
function incidentDetails($json) {
    $fields = count($json);
    $inci = '<div class="col w'.($fields == 1 ? '10' : '5').'0"><div class="data-list">';
    $col1 = $fields - floor($fields / 2);

    for ($i = 0; $i < $col1; $i++) {
        $inci .= '<div class="field"><div class="label">'.$json[$i]->desc.'</div>'.
        '<div class="desc">'.$json[$i]->info.'</div></div>';
    }
    
    if ($fields > 1) {
        $inci .= '</div></div><div class="col w50"><div class="data-list">';

        for ($i = $col1; $i < $fields; $i++) {
            $inci .= '<div class="field"><div class="label">'.$json[$i]->desc.'</div>'.
            '<div class="desc">'.$json[$i]->info.'</div></div>';
        }
    }

    return $inci.'</div></div>';
}

$fireJSON = json_decode(file_get_contents('https://api.mapotechnology.com/v1/wildfires/incident?key=50e2c43f8f63ff0ed20127ee2487f15e&history=1&wfid='.$_GET['wfid']));
$fire = $fireJSON->fire;

// definitions of various statuses used
$term[] = 'The status of a wildfire suppression action signifying that a control line has been completed around the fire, and any associated spot fires, which can reasonably be expected to stop the fire’s spread.';
$term[] = 'The completion of control line around a fire, any spot fires therefrom, and any interior islands to be saved; burned out any unburned area adjacent to the fire side of the control lines; and cool down all hot spots that are immediate threats to the control line, until the lines can reasonably be expected to hold under the foreseeable conditions.';
$term[] = 'The wildfire is fully supressed, out, and no further heat and smoke is detected.';

// if the API returns successful
if (!$fire->error) {
    date_default_timezone_set($fire->time->timezone);
    $fireName = fireName($fire->properties->fireName, $fire->properties->type, $fire->properties->incidentId);
    $dispatch = $fire->protection->dispatch;
    $agency = $fire->protection;
    $acres = $fire->properties->acres == 'Unknown' || $fire->properties->acres == '' ? 'Unknown' : numberFormat($fire->properties->acres);
    $status = $fire->time->year < date('Y') ? 'out' : getStatus($fire->properties->status, $fire->properties->notes);
    $status = $status ? $status : 'active';
    $gloss = $term[($status == 'contained' ? 0 : ($status == 'controlled' ? 1 : 2))];
    $abbr = $agency->agency;
    $near = $fire->geometry->near;
    $en = explode(', ', $near);
    $geolocation = $en[0].', '.convertState($en[1], 1);

    preg_match('/of (.*?),\s([A-Z]{2})/', $near, $match);
    $near_long = $match[1].', '.convertState($match[2]);

    if ($agency->agency != 'US Forest Service') {
        $abbr = $agencies[$agency->agency];
    }

    if ($fire->inciweb->photo->url) {
        $photo = 'https://www.mapofire.com/src/images/incident?path='.$fire->inciweb->photo->url;
    }

    $bkdispatch = substr($agency->dispatch, 0, 2).'-'.substr($agency->dispatch, 2, strlen($agency->dispatch));
    $center = mysqli_fetch_assoc(mysqli_query($con, "SELECT agency, name, cad_update, location, website, phone FROM dispatch_centers WHERE agency = '$agency->dispatch' OR agency = '$bkdispatch'"));
    mysqli_close($con);

    $juris = '<b>'.strtoupper($fire->properties->type).'</b> reported in '.convertState($fire->properties->fireState, 1) . ($dispatch == '' || ($dispatch == 'MAPO' && $agency->agency == '') ? ', by National Interagency Fire Center' : ($agency->area ? ', <span style="line-height:1.5;border-bottom:1px dotted #333;cursor:help" title="'.$agency->agency.' - '.$agency->area.' ('.$agency->unit.')'.'">'.
            ($abbr ? $abbr.' ' : '').$agency->area.'</span>' : ($agency->unit == 'NWCG' ? ', by NWCG/Inciweb' : '')));
    $agLogo = $agency->logo || $dispatch == 'CAL FIRE' ? '<img style="width:50px" src="https://d3kcsn1y1fg3m9.cloudfront.net/fire/images/agency_'.($agency->logo ? $agency->logo : ($dispatch == 'CAL FIRE' ? 'calfire' : '')).'_logo.png" alt="'.$agency->agency.' - '.$agency->area.' ('.$agency->unit.')'.'" title="'.$agency->agency.' - '.$agency->area.' ('.$agency->unit.')'.'">' : '';

    $title = $fireName.' near '.$near_long.' - Current Wildfire Information and Map';
    $desc = metaDesc($fireName, $near, $near_long, $acres, $fire);
} else {
    $title = 'Wildfire Not Found - Map of Fire: Current Incident Information and Wildfire Map';
    $desc = '';
}
?>
<!DOCTYPE html>

<html lang="en-US" xmlns:og="http://ogp.me/ns#">
    <head>
        <link rel="preconnect" href="//mapotechnology.com/">
        <link rel="preconnect" href="//fonts.gstatic.com/">
        <link rel="preconnect" href="//fontawesome.com">
        <link rel="preconnect" href="//ka-p.fontawesome.com">
        <link rel="preconnect" href="//api.mapbox.com">
        <title><?=$title?></title>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2, user-scalable=1" />
        <meta name="description" content="<?=$desc?>">
        <meta property="og:title" content="<?=$title?>">
        <meta property="og:description" content="<?=$desc?>">
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="Map of Fire">
        <meta property="og:url" content="https://www.mapofire.com<?=$_SERVER['REQUEST_URI']?>">
        <meta property="og:image" content="<?=$photo ? $photo : $mapoURL.'assets/images/mapofire_logo_square.png'?>">
        <meta property="og:image:alt" content="<?=($fire->inciweb->photo->caption ? $fire->inciweb->photo->caption : 'MAPO LLC')?>">
        <meta property="article:published_time" content="<?=date('c', $fire->time->captured)?>">
        <meta property="article:modified_time" content="<?=date('c', $fire->time->updated)?>">
        <meta property="twitter:card" content="summary_large_image">
        <meta property="twitter:url" content="https://www.mapofire.com<?=$_SERVER['REQUEST_URI']?>">
        <meta property="twitter:title" content="<?=$title?>">
        <meta property="twitter:description" content="<?=$desc?>">
        <meta property="twitter:image" content="<?=$photo ? $photo : $mapoURL.'assets/images/mapofire_logo_square.png'?>">
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#ffc65c" />
        <meta name="robots" content="index,follow">
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@200;300;400;500;600&display=swap" />
        <link rel="stylesheet" href="<?=$mapoURL?>src/css/global.css">
        <link rel="stylesheet" href="https://www.mapofire.com/v2.0/inc.app.css">
        <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.css">
        <script async defer src="https://kit.fontawesome.com/aa68e0c9b6.js" crossorigin="anonymous"></script>
        <script src="https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.js"></script>
        <link rel="shortcut icon" href="<?=$mapoURL?>assets/images/favicon.ico" type="image/x-icon" />
        <link rel="canonical" href="https://www.mapofire.com<?=$_SERVER['REQUEST_URI']?>" />
        <link rel="shortlink" href="<?=$baseURL?>incident.php?<?=$_SERVER['QUERY_STRING']?>" />
    </head>
    <body>

        <header>
            <div class="container">
                <a class="logo" href="<?=$baseURL?>"><img src="<?=$mapoURL?>assets/images/mapofire_logo.png"></a>
                <nav>
                    <div class="menuIcon"><i class="far fa-bars"></i></div>
                    <ul>
                        <li><a href="<?=$baseURL?>">Back to Map</a></li>
                        <li><a href="<?=$baseURL?>list-of-wildfires">List of Fires</a></li>
                        <li><a href="<?echo $mapoURL.($_SESSION['uid'] ? 'account/home?ref=inc_page' : 'secure/login?service=mapofire&next='.urlencode('https://www.mapofire.com/'.$_SERVER['REQUEST_URI']))?>"><?=$_SESSION['uid'] ? 'Account' : 'Login'?></a></li>
                    </ul>
                </nav>
            </div>
        </header>

        <main>
            <div class="container">
                <?if ($fire->error){?>
                    
                <?}else{?>
                <section>
                    <div class="row space-between align-center">
                        <div class="col w50">
                            <div class="title">
                                <?if($_SESSION['role'] == 'ADMIN') {?>
                                <a target="blank" href="<?=$mapoURL?>account/admin/wildfires/edit?wfid=<?=$fire->properties->wfid?>"><i class="far fa-pen-to-square"></i></a>
                                <?}?>
                                <h1>
                                    <?=$fireName?>
                                    <span title="Coordinates for <?=$fireName?>" class="coords blur">0.0000, -0.0000</span>
                                </h1>
                            </div>
                        </div>
                        <div class="col w50">
                            <div class="juris">
                                <?if($agLogo){
                                    echo $agLogo;
                                }?>
                                <p><?=$juris?></p>
                            </div>
                        </div>
                    </div>

                    <div class="stats">
                        <div class="stat">
                            <p>Status</p>
                            <div class="v" style="font-size:16px"><span class="status <?=$status?>" title="<?=$gloss?>"><?=$status?></span></div>
                        </div>
                        <div class="stat size">
                            <p>Size</p>
                            <div class="v"><?=$acres?> <small>acres</small></div>
                        </div>
                        <div class="stat">
                            <p>Containment</p>
                            <div class="v"><span class="full-contain <?=$fire->properties->containment == '100%' ? 'fas fa-circle-check' : 'fas fa-circle-xmark not'?>"></span><?=$fire->properties->containment?></div>
                        </div>
                        <div class="stat">
                            <a href="#" id="follow" class="btn btn-sm btn-red" data-mode="follow" style="margin:0"><i class="far fa-plus"></i>Follow this incident</a>
                        </div>
                    </div>

                </section>

                <section id="map" data-lat="<?=$fire->geometry->lat?>" data-lon="<?=$fire->geometry->lon?>">
                    <div class="loading"></div>
                </section>

                <section>
                    <a href="#" class="btn btn-blue btn-large">Follow this incident</a>

                    <p class="times">
                        <span>Last updated <b><?=ago($fire->time->updated)?></b></span><span>Reported <b><?=time() - $fire->time->discovered > 15768000 ? date('D, M j, Y \a\t g:i A', $fire->time->discovered) : ago($fire->time->discovered)?></b> via <b title="<?=$center['name']?>"><?=$fire->protection->dispatch?></b></span><span>Incident # <b><?=$fire->properties->incidentId?></b></span>
                    </p>

                    <div class="row no-gap75">
                        <div class="col w50">
                            <div class="data-list">
                                <div class="data">
                                    <div class="icon"><i class="fas fa-location-dot"></i></div>
                                    <div class="label">Initial Location</div>
                                    <div class="value"><?=$near?></div>
                                </div>
                                <div class="data">
                                    <div class="icon"><i class="fad fa-trees"></i></div>
                                    <div class="label">Dispatch Notes</div>
                                    <div class="value"><?=$fire->properties->notes ? $fire->properties->notes : 'N/A'?></div>
                                </div>
                                <div class="data">
                                    <div class="icon"><i class="fal fa-sensor-triangle-exclamation"></i></div>
                                    <div class="label">Assigned Resources</div>
                                    <div class="value"><?=$fire->properties->resources ? $fire->properties->resources : 'N/A'?></div>
                                </div>  
                            </div>
                        </div>
                        <div class="col w50">
                            <div class="data-list">
                                <div class="data">
                                    <div class="icon"><i class="fas fa-tower-observation"></i></div>
                                    <div class="label">Responsible Agency</div>
                                    <div class="value"><?=!$agency->agency && !$agency->unit ? 'Unknown' : ($agency->agency ? $agency->agency : '').($agency->area ? ($agency->agency ? ' &mdash; ' : '').$agency->area : '')?></div>
                                </div>
                                <div class="data">
                                    <div class="icon"><i class="fad fa-trees"></i></div>
                                    <div class="label">Fuels</div>
                                    <div class="value"><?=$fire->properties->fuels ? $fire->properties->fuels : 'None specified'?></div>
                                </div>
                                <div class="data">
                                    <div class="icon"><i class="fad fa-chart-line"></i></div>
                                    <div class="label">Incident Status</div>
                                    <div class="value cco">
                                    <?if ($status != null && ($fire->properties->status->Contain || $fire->properties->status->Control || $fire->properties->status->Out)) {
                                        if ($fire->properties->status->Contain) {
                                            $detstat .= 'Contained on '.date('M j, Y \a\t g:i A T', $fire->properties->status->Contain).' &middot; ';
                                        }
                                        if ($fire->properties->status->Control) {
                                            $detstat .= 'Controlled on '.date('M j, Y \a\t g:i A T', $fire->properties->status->Control).' &middot; ';
                                        }
                                        if ($fire->properties->status->Out) {
                                            $detstat .= 'Out on '.date('M j, Y \a\t g:i A T', $fire->properties->status->Out);
                                        }

                                        echo substr($detstat, 0, -10);
                                    }?>
                                    </div>
                                </div>  
                            </div>                          
                        </div>
                    </div>

                    <div class="row">
                        <div class="col w50">
                            <div class="card">
                                <h2>Nearby Weather Conditions</h2>
                                <div class="wx" id="curwx">
                                    <div class="loading centered"></div>
                                </div>
                            </div>
                        </div>
                        <div class="col w50">
                            <div class="card">
                                <h2>Incident Weather Concerns</h2>
                                <div class="wx p4" id="fcstwx">
                                    <div class="loading centered"></div>
                                </div>
                            </div>                            
                        </div>
                    </div>

                    <div class="row">
                        <div class="col w100">
                            <div id="acres_history"><div class="loading"></div></div>
                        </div>
                    </div>
                    
                    <? if($fire->inciweb) {?>
                    <div class="row inciweb">
                        <div class="col w100">
                            <h2>Incident Overview</h2>
                            <div class="text">
                                <?if($photo) {
                                    echo '<div class="row"><div class="col w25"><figure><img src="'.$photo.'">'.
                                    ($fire->inciweb->photo->caption ? '<span><i class="far fa-message" style="padding-right:0.5em"></i>'.$fire->inciweb->photo->caption.'</span>' : '').
                                    '</figure></div><div class="col w75">'.$fire->inciweb->incident_info.'</div></div>';
                                } else {
                                    echo $fire->inciweb->incident_info;
                                }?>
                            </div>
                        </div>
                    </div>

                    <?if ($fire->inciweb->current->data->{'Basic Information'}) {?>
                    <h2>Basic Information</h2>
                    <div class="row">
                        <?=incidentDetails($fire->inciweb->current->data->{'Basic Information'})?>
                    </div>
                    <?}?>

                    <?if ($fire->inciweb->current->data->{'Current Situation'}) {?>
                    <h2>Current Situation</h2>
                    <div class="row">
                        <?=incidentDetails($fire->inciweb->current->data->{'Current Situation'})?>
                    </div>
                    <?}?>

                    <?if ($fire->inciweb->current->data->{'Outlook'}) {?>
                    <h2>Outlook</h2>
                    <div class="row">
                        <?=incidentDetails($fire->inciweb->current->data->{'Outlook'})?>
                    </div>
                    <?}?>

                    <?if ($fire->inciweb->current->data->{'Current Weather'}) {?>
                    <h2>Current Weather</h2>
                    <div class="row">
                        <?=incidentDetails($fire->inciweb->current->data->{'Current Weather'})?>
                    </div>
                    <?}?>

                    <? if($fire->inciweb->contacts->pio){?>
                    <div class="row">
                        <div class="col w100">
                            <h2>Public Information</h2>
                            <p><?=$fire->inciweb->contacts->pio?></p>
                        </div>
                    </div>
                    <?}
                    }?>

                    <div class="row">
                        <div class="col w100">
                            <h2>Dispatch Center</h2>
                            <p style="font-weight:500"><?=$center['name']?> (<?=$center['agency']?>)</p>
                            <p><?=$center['location']?></p>
                            <?if($center['website']){?>
                            <p><a target="blank" href="<?=$center['website']?>"><?=$center['website']?></a></p>
                            <?}?>
                        </div>
                    </div>
                </section>
                <?}?>

                <div class="social">
                    <div class="icons">
                        <i class="fab fa-facebook" id="fb" title="Share on Facebook"></i>
                        <i class="fab fa-x-twitter" id="X" title="Share on X (Twitter)"></i>
                        <i class="fab fa-tiktok" id="tiktok" title="Find videos on TikTok"></i>
                        <i class="fal fa-share-nodes" id="sharer" title="Share:text, email, or copy link"></i>
                    </div>
                </div>
        </main>

        <footer>
            <div class="container">
                <div class="row space-between align-center">
                    <div class="col w50">
                        &copy; <?=date('Y')?> MAPO LLC
                    </div>
                    <div class="col w50">
                        <ul>
                            <li><a target="blank" href="https://donate.stripe.com/3csg1F7PF8gpfni003">Support</a></li>
                            <li><a href="<?=$mapoURL?>about">About</a></li>
                            <li><a href="<?=$mapoURL?>contact">Contact</a></li>
                            <li><a href="<?=$mapoURL?>about/legal/terms">Terms</a></li>
                            <li><a href="<?=$mapoURL?>about/legal/privacy">Privacy</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>

        <!--<script async src="https://www.googletagmanager.com/gtag/js?id=G-X03WWLX3BJ"></script>-->
        <script>/*window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-X03WWLX3BJ');*/const incident=<?unset($fireJSON->fire->inciweb);unset($fireJSON->metadata);$fireJSON->fire->geometry->near_long = $near_long;echo json_encode($fireJSON->fire)?>;</script>
        <script src="https://www.mapofire.com/v2.0/inc.app.js"></script>
    </body>
</html>