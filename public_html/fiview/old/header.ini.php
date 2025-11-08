<?
session_start();
require('config.inc.php');
require('secure.inc.php');
$_SESSION[timezone] = $agency[timezone];
date_default_timezone_set($_SESSION[timezone]);
?>
<!DOCTYPE html>

<html>
<head>
<title><?=$software_name?> (<?=$_SESSION[name]?>) | <?=$agency[fullname]?></title>
<link href="https://fonts.googleapis.com/css?family=Noto+Sans+JP:200,500,400,600|Source+Sans+Pro:200,400,600" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@<?=$versions['bootstrap']?>/dist/css/bootstrap.min.css"  rel="stylesheet" crossorigin="anonymous">
<link href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css" rel="stylesheet">
<style>
::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-track{background:#ccc;border-radius:2px}
::-webkit-scrollbar-thumb{background:#999;border-radius:2px}
::-webkit-scrollbar-thumb:hover{background:#666;}
::placeholder{color:#ccc;opacity:0.2}
*{box-sizing:border-box}
html,body{width:100%;height:100%;margin:0;padding:0;background-color:#f4f6f9;font-size:0.95em}
a, a:visited{transition:all .1s ease-in-out;text-decoration:none}
a:hover, a:visited:hover{text-decoration:none}
#modal{position:fixed;display:none;top:50%;left:50%;transform:translate(-50%,-50%);padding:10px;width:100%;height:100%;max-height:500px;z-index:999}
#modal.small{max-width:550px;height:250px}
#modal #content{width:100%;height:100%;background-color:#fff;border-radius:5px;padding:10px;overflow-x:hidden;overflow-y:auto}
.modal-header{padding:0.4rem 0.4rem 0.4rem 0;border-bottom:0}
.modal-header h2{margin:0 0 0.5em 0;padding:0;line-height:100%;font-size:1.5em}
.modal-header i.fas{position:absolute;top:0;line-height:178%;right:0;margin:17px 25px 0 0;font-size:1.4em;color:#616161;cursor:pointer;transition:all .1s ease-in-out}
.modal-header i.fas:hover{color:#989898}
#modal #content .inner-content{display:block;width:100%;height:auto;padding:0 0 5px 0}
#modal #content .inner-content .row.form-head:first-child{margin-top:0}
/*#modal #content .inner-content select, #modal #content .inner-content input{padding:2px 7px!important;height:auto!important}*/
#shadow{position:fixed;display:none;top:0;left:0;width:100%;height:100%;background-color:rgba(0, 0, 0, 0.7);z-index:997}
#page_loading{display:none;position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);z-index:999;}
header{display:flex;width:100%;height:55px;background-color:#fff;color:#1f2d3d;font-size:16px;box-shadow:0 0 5px 3px #999}
header .container-fluid, footer .container-fluid{margin:0 15px}
.nav-menu{position:absolute;display:block;top:55px;left:-305px;width:100%;max-width:300px;height:100%;margin:0;padding:20px 30px;background-color:#292929;box-shadow:3px 2px 3px #222;z-index:998}
.nav-menu ul{list-style-type:none;margin:0;padding:0}
.nav-menu ul li{margin:0;padding:10px 0}
.nav-menu ul li a{font-family:Noto Sans JP;font-size:1em;color:#dc3545}
.nav-menu ul li a:hover{color:#f9f9f9}
.nav-menu ul li a i{width:1.5em;margin-right:15px}
.row.form-head{font-weight:500;font-size:0.9em;padding-bottom:2px;margin-top:7px;color:#848484}
.row.inner-block input, .row.inner-block select{display:inline-block}
.row > div input{margin-bottom:5px}
textarea{resize:none}
.row.fill{height:100%;/*border:1px solid blue*/}
.row > div{/*border:1px solid red*/}
section{display:block;width:100%;height:auto;min-height:150px}
section.page{padding:15px;margin:25px auto}
section.page .container-fluid{min-height:250px;padding:10px 15px 75px 15px;background-color:#fff}
section .container-fluid{padding:10px 15px}
section.page h2{margin-bottom:25px}
section.page h4{color:#f9a03f}
section.page select{margin-bottom:5px}
header .title{font-size:20px;font-weight:600;color:#dc3545;letter-spacing:-1px}
header .menu i.fa-bars, header .menu i.fa-times{font-size:24px;cursor:pointer}
ul.navbar-nav{display:flex;flex-direction:row;align-items:center;justify-content:flex-end}
li.nav-item{position:relative;padding:0 7.5px}
li.nav-item:first-child{padding-left:0}
li.nav-item:last-child{padding-right:0}
.nav-link{position:relative;font-size:1.25em;color:#282829}
.nav-link:focus,.nav-link:hover,.nav-link:visited:hover{color:#ffc84c;}
.navbar-badge{position:absolute;right:-10px;top:7px;background-color:#58d00d;font-size:0.8rem;font-weight:400;padding:2px 4px;}
ul.nav-tabs li.nav-item{padding:0 2px}
ul.nav-tabs .nav-link{font-size:1em;padding:5px 10px;color:#ff6c03}
.btn-panel{display:inline-block;margin:7px 0}
.btn > i.fas, .btn > i.far, .btn > i.fal{padding-right:5px}
.box{position:relative;display:flex;width:100%;height:auto;min-height:150px;background-color:#343a40;color:#fff;border-radius:0.25rem;border:0 solid rgba(0,0,0,.125);box-shadow:0 0 1px rgb(0 0 0 / 13%), 0 1px 3px rgb(0 0 0 / 20%)}
.box.vert{flex-direction:column}
.box.horiz{flex-direction:row}
.box .row.title{width:auto;height:33px;align-items:center;margin:0;border-bottom:1px solid rgba(255, 255, 255, 0.15)}
.box .row.title .col, .box .row.title .col-md-4{font-family:Noto Sans JP;font-size:1em;font-weight:500;line-height:0;letter-spacing:0.04em;color:#ffe498}
.box .row.title .col, .box .row.title .col-md-4, .box .row.title .col-md-8{padding:5px;}
.box .row.title .col i, .box .row.title .col-md-4 i, .box .row.title .col-md-8 i{font-size:0.8em;line-height:0;padding-right:10px}
.box .row.title .col i.icon, .box .row.title .col-md-8 i.icon{font-size:0.7em;color:#fff;padding:2px 10px 0 0}
.box .contents{width:100%;height:300px;padding:5px;overflow-x:hidden}
.table-responsive{height:100%}
table.table{margin:0}
section.page table.table tr th, table.table tr td{padding:0.25em 0.45em}
section.page table.table thead.thead-dark tr th{color:#fff}
section.page table.table.table-striped tr:hover td{background-color:#bbb!important;}
table.table tr th, table.table tr td{padding:0.45em 0}
table.table td{cursor:pointer;transition:all .1s ease-in-out}
table.table tr:hover td{background-color:#555}
.table thead{position:sticky;top:0;}
.table thead th{background-color:#343a40!important;border-top:0;}
.table-dark td, .table-dark th, .table-dark thead th{font-size:0.93em;border-color:#616161;background-color:#454a4f}
.table#active_incidents th, .table#active_incidents td, .table#pending_incidents th, .table#pending_incidents td, .table#resources th, .table#resources td, .table#log th, .table#log td{padding:5px 2px!important}
table#log thead th, table#log tbody td{font-size:0.8em;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;max-width:43px;}
.table#active_incidents td.resources div{display:inline-block;padding-right:5px}
.table#active_incidents td.resources div:last-child{display:inline-block;padding-right:0}
.table#active_incidents td.resources div.enr, .status.enr{color:#ff3bc3}
.table#active_incidents td.resources div.ons, .status.ons{color:#ff2323}
.table#active_incidents td.resources div.lea, .status.lea{color:#00ff00}
.table#active_incidents td.resources div.not, .status.not{color:#817fff}
.table#active_incidents td.resources div.avos, .status.avos{color:#ff991b}
.table#active_incidents td.resources div.com, .status.com{color:#fbff08}
.status.ava{color:#50ec34}
.status.ins{color:#5ff1e2}
.status.ous{color:#bbb}
select,input{outline:0}
#modal .alert{padding:5px 10px}
section.page table th, table td{padding:5px!important;line-height:100%}
section.page table tr:hover{color:#fff}
input.form-control{padding:0.25em 0.5em}
.form-control:focus{box-shadow:0 0 0 0.05rem rgb(13 110 253 / 25%)}
.form-check-input:focus{box-shadow:0 0 0 0.15rem rgb(13 110 253 / 25%)!important}
select.custom-select-sm, .form-control.form-control-sm{height:auto;margin:0;padding:1px 4px;font-size:12px}
/*.tooltip-inner{font-family:source sans pro;font-size:0.95em}*/
#full-notes.btn, #add-notes.btn, #unit-status.btn{margin-right:10px;padding:0 5px 3px 5px;font-size:18px;line-height:100%}
#full-notes.btn i, #add-notes.btn i, #unit-status.btn i{line-height:0;padding:0}
.filter-hide{visibility:collapse;}
.small-log{}
.small-log .line{display:flex;flex-wrap:wrap;width:100%;align-items:flex-start;font-size:0.85em}
.small-log .line:nth-child(odd){background-color:#555}
.small-log .line div{display:flex;padding:1px}
.small-log .line .time{flex:1 1 25%;max-width:25%;padding:1px 1px 1px 0}
.small-log .line .from{flex:1 1 9%;max-width:9%}
.small-log .line .to{flex:1 1 9%;max-width:9%}
.small-log .line .msg{flex:1 1 57%;max-width:57%;padding:1px 0 1px 1px}
fieldset{position:relative;border:1px solid #888;border-radius:5px;padding:10px;margin-bottom:25px}
fieldset legend{position: absolute;top:-14px;display:block;width:unset;padding:0 10px;font-size:16px;font-weight:bold;color:#888;background-color:#fff;}
</style>
</head>
<body>

<header>
 <div class="container-fluid">
  <div class="row fill align-items-center">
   <div class="col-md-1 menu">
    <div id="menu-btn" data-menu="0"><i class="fas fa-bars"></i></div>
   </div>
   <div class="col-md-7 title">
    WildUSA Fire Dispatch (<?=$agency[agency_id]?>)
   </div>
   <div class="col-md-4">
    <ul class="navbar-nav ml-auto">
     <li class="nav-item" data-toggle="tooltip" data-placement="top" title="Add new incident"><a class="nav-link" href="#" id="newInc" onclick="return false"><i class="fas fa-plus-square"></i></a></li>
     <li class="nav-item" data-toggle="tooltip" data-placement="top" title="Edit Timers"><a class="nav-link" href="#" id="" onclick="return false"><i class="far fa-clock"></i></a></li>
     <li class="nav-item" data-toggle="tooltip" data-placement="top" title="Edit Log"><a class="nav-link" href="#" id="" onclick="return false"><i class="far fa-sticky-note"></i></a></li>
     <li class="nav-item" data-toggle="tooltip" data-placement="top" title="Open Mapping"><a class="nav-link" href="#" id="dispatch_map" onclick="return false"><i class="fas fa-map-marker-alt"></i></a></li>
     <li class="nav-item" data-toggle="tooltip" data-placement="top" title="Command line"><a class="nav-link" href="#" id="cmd" onclick="return false"><i class="fas fa-terminal"></i></a></li>
     <li class="nav-item dropdown" data-toggle="tooltip" data-placement="top" title="Notifications"><a class="nav-link" href="#" id="" onclick="return false"><i class="far fa-bell"></i><span class="badge badge-warning navbar-badge">4</span></a></li>
     <li class="nav-item pl-4"><?=$_SESSION[name]?></li>
    </ul>
   </div>
  </div>
 </div>
</header>

<div class="nav-menu">
<ul>
 <li><a href="#"><i class="fas fa-user-cog"></i>My Settings</a></li>
 <li><a href="#"><i class="fas fa-search"></i>Search</a></li>
 <li><a href="#"><i class="far fa-truck-moving"></i>Resources</a></li>
 <li><a href="admin" target="blank"><i class="fas fa-cog"></i>CAD Configuration</a></li>
 <li><a href="#"><i class="fas fa-sign-out-alt"></i>Logout</a></li>
</ul>
</div>