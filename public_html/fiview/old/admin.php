<?include('header.ini.php')?>

<section class="page">
<div class="container-fluid">
<div class="row">
<div class="col">

<h2><?=$software_name?> Administration</h2>

<span class="help">These functions allow you to setup the system for your dispatch center. Only functions you have permission for will be shown.</span><br><br>

<h4>General</h4>
<ul>
 <li><a href="admin/center/edit">Edit Center Information</a></li>
 <li><a href="admin/cad">Manage CAD Settings</a></li>
 <li><a href="admin/areas/jurisdictions">Manage Center Jurisdictions</a></li>
 <li><a href="admin/areas/zones">Manage Dispatch Zones</a></li>
</ul>

<h4>People/Users</h4>
<ul>
 <li><a href="admin/dispatchers">Manage Dispatchers</a></li>
</ul>

<h4>Incidents</h4>
<ul>
 <li><a href="admin/incidents/types">Edit Incident Types</a></li>
</ul>

<h4>Resources</h4>
<ul>
 <li><a href="admin/resources">Add/Edit Resources</a></li>
</ul>

</div>
</div>
</div>
</section>

<?include('footer.ini.php')?>