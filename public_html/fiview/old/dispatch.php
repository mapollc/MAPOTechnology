<?include_once('header.ini.php');
if(isset($_GET[page])){
 $pg = 'cad/'.$_GET[page].'.ini.php';
 if(file_exists($pg)){
  include($pg);
 }else{
  //show 404
 }
}else{?>
<section>
 <div class="container-fluid">
  <div class="row">
   <div class="col-md-8">
    <div class="row mb-3">
     <div class="col">
      <div class="box vert">
     <div class="row title"><div class="col"><i class="fas fa-clock"></i>Active Incidents</div><div class="col text-end"><i class="fas fa-filter icon"></i><select id="active_filter_zone" class="custom-select custom-select-sm" style="max-width:105px"><option value="All">All Zones</option></select></div></div>
       <div class="contents">
        <div class="table-responsive">
         <table class="table table-dark" id="active_incidents">
          <thead><tr><th scope="col" style="width:15%">Incident</th><th scope="col" style="width:15%">Name</th><th scope="col" style="width:10%">Type</th><th scope="col" style="width:40%">Resources</th><th scope="col" style="width:10%">Time</th></tr></thead>
          <tbody></tbody>
         </table>
        </div>
       </div>
      </div>
     </div>
    </div>
    <div class="row">
     <div class="col">
      <div class="box vert">
     <div class="row title"><div class="col"><i class="far fa-clock"></i>Pending Incidents</div><div class="col text-end"><i class="fas fa-filter icon"></i><select id="pending_filter_zone" class="custom-select custom-select-sm" style="max-width:105px"><option value="All">All Zones</option></select></div></div>
       <div class="contents">
        <div class="table-responsive">
         <table class="table table-dark" id="pending_incidents">
          <thead><tr><th scope="col" style="width:15%">Incident</th><th scope="col" style="width:15%">Name</th><th scope="col" style="width:10%">Type</th><th scope="col" style="width:40%">&nbsp;</th><th scope="col" style="width:10%">Time</th></tr></thead>
          <tbody></tbody>
         </table>
        </div>
       </div>
      </div>
     </div>
    </div>   </div>
   <div class="col-md-4">
    <div class="row mb-3">
    <div class="col">
    <div class="box vert">
     <div class="row title"><div class="col-md-4"><i class="far fa-user"></i>Resources</div><div class="col-md-8 text-end"><a href="#" class="btn btn-info btn-sm" id="unit-status" data-toggle="tooltip" data-placement="top" title="Change Unit Status"><i class="fas fa-sign-in-alt"></i></a> <i class="fas fa-filter icon"></i>
		 <select id="units_filter_zone" class="custom-select custom-select-sm" style="max-width:105px">
		  <option value="All">All Zones</option>
		 </select>
		 <select id="filter_status" class="custom-select custom-select-sm" style="max-width:57px">
		  <option>All</option><option>Ava</option>
			<option>Avos</option><option>Ins</option>
			<option>Ous</option><option>Enr</option>
			<option>Not</option><option>Ons</option>
			<option>Com</option><option>Lea</option>
		 </select></div></div>
     <div class="contents">
      <div class="table-responsive">
       <table class="table table-dark" id="resources">
        <thead><tr><th scope="col" style="width:30%">Unit</th><th scope="col" style="width:30%">&nbsp;</th><th scope="col" style="width:30%">Status</th><th scope="col" style="width:15%">Time</th></tr></thead>
        <tbody></tbody>
       </table>
      </div>
     </div>
    </div>
   </div>
   </div>
   <div class="row mb-3">
    <div class="col">
<div class="box vert">
     <div class="row title"><div class="col-md-4"><i class="far fa-sticky-note"></i>Log</div><div class="col-md-8 text-end">
      <a href="dispatch/log" target="blank" class="btn btn-secondary btn-sm" style="margin-right:5px" id="full-notes" data-toggle="tooltip" data-placement="top" title="View Full Notes"><i class="far fa-clipboard"></i></a>
			<a href="#" class="btn btn-success btn-sm" style="margin-right:0" id="add-notes" data-toggle="tooltip" data-placement="top" title="Add Notes"><i class="far fa-comment-alt"></i></a></div>
		 </div>
     <div class="contents">
      <div class="table-responsive">
       <table class="table table-dark" id="log">
        <thead><tr><th scope="col" style="width:25%">Time</th><th scope="col" style="width:10%">From</th><th scope="col" style="width:10%">To</th><th scope="col" style="width:55%">Event</th></tr></thead>
        <tbody></tbody>
       </table>
      </div>
     </div>
    </div>
    </div>
   </div>
   </div>
  </div>
 </div>
</section>

<?
$scripts[] = 'src/assets/resources/js/dispatch';
}

$scripts[] = 'src/assets/resources/js/general';

include_once('footer.ini.php');
?>