<h1 style="text-align:center">You have insufficient permissions</h1>

<p style="margin:3em;color:var(--red);text-align:center;font-size:22px">Your <?=$software_name?> administrator has not given you permissions to access this function or feature.<br><br>
Please contact them to gain access.</p>

<p style="text-align:center"><input type="button" class="btn blue" onclick="history.go(-1)" value="Go Back"></p>

</div>
</div>
</div> 
</div>
</main>

<script>var config = <?=json_encode($config)?>, allAgencies = [];</script>
<?=js(array('jquery','main','admin'))?>

</body>
</html>