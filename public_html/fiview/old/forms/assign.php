<div class="modal-header">
<h2>Assign Resource<?=($_REQUEST[no_inc]!=1 ? ': <b>'.$_GET[unit].'</b>' : '')?></h2><i class="fas fa-times" id="closeModal"></i>
</div>
<div class="inner-content">

<form action="" method="" id="assign_resource">
<?if($_REQUEST[no_inc]!=1){ echo '<input type="hidden" name="unit" value="'.$_GET[unit].'">'; }
else{ echo '<input type="hidden" name="no_inc" value="1">'; }?>

<?if(isset($_REQUEST[unit])){?>
<div class="row text-center" style="font-size:1.2em">
 <div class="col-md-6">
  Active Incidents:<br>
  <select name="active_incidents" class="form-select"><option>- Choose -</option></select>
 </div>
 <div class="col-md-6">
  Pending Incidents:<br>
  <select name="pending_incidents" class="form-select"><option>- Choose -</option></select>
 </div>
</div>
<?}?>

<div class="row text-center mt-2" style="font-size:1.2em">
 <div class="col">
  <?if($_REQUEST[no_inc]==1){?>
	Resource:<br>
	<select name="unit" class="form-select mx-auto" style="max-width:175px"><option></option></select>
	<?}?>
	
  Status:<br>
  <select name="status" class="form-select mx-auto" style="max-width:175px"><option></option><?foreach($resourceStatus as $k => $v){
   echo '<option value="'.$k.'">'.$v.'</option>';
  }?></select>
 </div>
</div>

<p class="text-center my-3"><input type="submit" class="btn btn-success" value="Assign Resource"></p>
</form>

</div>

<script>
var tmp_inc_ids = [],
    inc = <?=($_REQUEST[inc] ? '\''.$_REQUEST[inc].'\'' : '\'\'')?>,
    no_inc = <?=($_REQUEST[no_inc]==1 ? 1 : 0)?>;

$.ajax({
  url: host + 'ajax/api/cad/incidents',
	method: 'POST',
	dataType: 'json',
	success: function(r) {
	  if (r.response.active && r.response.active.length > 0) {
      for (var i = 0; i < r.response.active.length; i++) {
        if (tmp_inc_ids.includes(r.response.active[i].id) === false) {
				  var snum = r.response.active[i].jurisdiction.substr(2, r.response.active[i].jurisdiction.length) + '-' + r.response.active[i].num,
					    lnum = r.response.active[i].jurisdiction + '-' + r.response.active[i].num;
          $('select[name=active_incidents]').append('<option ' + (inc == snum ? 'selected ' : '') + 'value="' + r.response.active[i].id + '|' + lnum + '">' + snum + ' (' + r.response.active[i].name + ')</option>');
        
	  			tmp_inc_ids.push(r.response.active[i].id);
				}
      }
		}
      
	  if (r.response.pending && r.response.pending.length > 0) {
  		for (var i = 0; i < r.response.pending.length; i++) {
        if (tmp_inc_ids.includes(r.response.pending[i].id) === false) {
				  var snum = r.response.pending[i].jurisdiction.substr(2, r.response.pending[i].jurisdiction.length) + '-' + r.response.pending[i].num,
					    lnum = r.response.pending[i].jurisdiction + '-' + r.response.pending[i].num;
          $('select[name=pending_incidents]').append('<option ' + (inc == snum ? 'selected ' : '') + 'value="' + r.response.active[i].id + '|' + lnum + '">' + snum + ' (' + r.response.active[i].name + ')</option>');
        
  			  tmp_inc_ids.push(r.response.pending[i].id);
				}
      }	
		}
	}
});

if (no_inc == 1) {
  $.ajax({
    url: host + 'ajax/api/cad/resources',
    method: 'POST',
    data: {
      agency: agency
    },
    dataType: 'json',
    success: function(r) {
      for (var i = 0; i < r.response.units.length; i++) {
			  $('select[name=unit]').append('<option value="' + r.response.units[i].unit + '">' + r.response.units[i].unit + '</option>');
			}
		}
	});
}

$('select[name=status]').on('change', function() {
  if ($(this).val() == 'ins' || $(this).val() == 'lea' || $(this).val() == 'ava' || $(this).val() == 'ous') {
	  $('select[name=active_incidents] option:first-child').prop('selected', 'selected');
    $('select[name=pending_incidents] option:first-child').prop('selected', 'selected');
  }
});
</script>