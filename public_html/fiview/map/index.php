<?
session_start();
include('../config.inc.php');
?>
<!DOCTYPE html>
<html>

<head>
    <title><?=$software_name.' (v'.$software_build.')'?> Mapping</title>
    <?= css(array('fonts', 'fa', 'leaflet', 'main')) ?>
    <style>
        ::-webkit-scrollbar {
            width: 5px
        }

        ::-webkit-scrollbar-track {
            box-shadow: inset 0 0 6px rgba(100, 100, 100, .3);
            -webkit-box-shadow: inset 0 0 6px rgba(100, 100, 100, .3)
        }

        ::-webkit-scrollbar-thumb {
            background: rgba(127, 127, 127, .8);
            box-shadow: inset 0 0 6px rgba(0, 0, 0, .5);
            -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, .5);
            transition: all .15s ease-in-out;
            cursor: pointer
        }

        ::-webkit-scrollbar-thumb:hover {
            background: rgba(107, 107, 107, .8)
        }

        html,
        body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: source sans pro;
            font-size: 16px;
            overflow: hidden
        }

        #map {
            width: 100%;
            height: 100%
        }

        .reset {

        }

        .search {
            position: absolute;
            top: 10px;
            left: 55px;
            width: auto;
            max-width: 400px;
            background-color: #fff;
            border-radius: 5px;
            z-index: 999
        }

        .search input {
            display: block;
            min-width: 300px;
            padding: 5px 10px;
            border: 1px solid #666;
            font-family: source sans pro;
            font-size: 16px;
            border-radius: 5px;
            outline: 0
        }

        #search-results {
            position: absolute;
            display: none;
            top: 42px;
            left: 55px;
            width: 315px;
            max-height: 350px;
            background-color: #fff;
            box-shadow: 0 0 20px rgb(10 10 10 / 50%);
            border-radius: 0 0 4px 4px;
            overflow-y: auto;
            z-index: 999;
        }

        #search-results #result {
            padding: 5px 10px;
            background-color: #555;
            color: #fff;
            transition: all .15s ease-in-out;
            user-select: none;
            cursor: pointer;
        }

        #search-results #result.no-click {
            cursor: auto;
        }

        #search-results #result:hover {
            background-color: #333;
        }

        #search-results #result.no-click:hover {
            background-color: #555;
        }

        #search-results #result:last-child {
            border-radius: 0 0 4px 4px;
        }

        .micon {
            position: absolute;
            display: flex;
            width: 30px;
            height: 30px;
            background-color: #fff;
            justify-content: center;
            align-items: center;
            border-radius: 5px;
            box-shadow: 0 0 10px rgb(50 50 50 / 55%);
            transition: all .15s ease-in-out;
            cursor: pointer;
            z-index: 999;
        }

        .micon:hover {
            background-color: #eee;
        }

        #panel {
            position: absolute;
            display: block;
            top: 150px;
            left: -300px;
            width: 300px;
            height: auto;
            min-height: 150px;
            background-color: #353535;
            font-family: source sans pro;
            font-size: 16px;
            color: #fff;
            line-height: 1.4;
            border-radius: 0 5px 5px 0;
            padding: 10px;
            overflow-y: auto;
            z-index: 9999;
        }

        #panel #close {
            position: absolute;
            top: 5px;
            right: 5px;
            font-family: "Font Awesome 6 Pro";
            font-weight: 300;
            line-height: 1;
            font-size: 18px;
            color: #f9f9f9;
            transition: all .15s ease-in-out;
            cursor: pointer;
        }

        #panel #close:hover {
            color: #d5d5d5;
        }

        .leaflet-control-layers-list {
            font-family: source sans pro!important;
            font-size: 13px!important;
        }

        .leaflet-control-zoom {
            border: 0!important;
            box-shadow: 0 0 10px rgb(50 50 50 / 55%)!important;
        }

        .leaflet-control-zoom-in {
            transition: all .15s ease-in-out;
            border-radius: 5px 5px 0 0!important;
        }

        .leaflet-control-zoom-out {
            transition: all .15s ease-in-out;
            border-radius: 0 0 5px 5px!important;
        }

        .leaflet-marker-icon {
            filter: hue-rotate(185deg)
        }

        .leaflet-marker-icon.incident {
            width: 23px!important;
            height: 23px!important;
            background-color: red;
            border-radius: 50%;
            filter: unset;
            box-shadow: 0 0 10px rgb(50 50 50 / 80%);
        }

        .leaflet-marker-icon.incident i {
            color: #fff;
            padding: 4px 5px;
            font-size: 15px;
        }

        .leaflet-marker-icon.gis {
            filter: hue-rotate(0deg)
        }

        .leaflet-popup-content {
            font-family: source sans pro;
            font-size: 15px!important;
        }

        .btn {
            display: block;
            max-width: 300px;
            margin-bottom: 1em;
            padding: 5px 10px;
            background-color: var(--gray2);
            border: 0;
            border-radius: 7px;
            font-family: poppins;
            font-size: 14px;
            font-weight: 100;
            text-decoration: none;
            transition: all .15s ease-in-out;
            cursor: pointer;
            outline: none
        }
    </style>
</head>

<body>
    <div id="panel"></div>
    <div class="search">
        <input type="text" id="q" placeholder="Search cities or locations..." value="">
    </div>
    <div id="search-results"></div>
    <div class="micon" id="reset" style="top:85px;left:10px"><i class="far fa-globe"></i></div>
    <div id="map"></div>

    <script>var agency = '<?=$_SESSION['agency']?>', host = '<?=str_replace('{agency}', $_SESSION['agency'], $agencyDomain)?>/';</script>
    <?= js(array('jquery', 'leaflet', 'map')) ?>
</body>

</html>