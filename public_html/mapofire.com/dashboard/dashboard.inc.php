<h1 class="title">Current U.S. Wildfire Status: Today<span id="fetchTime"></span></h1>
<a href="//mapofire.com?utm_campaign=mapofire&utm_medium=button&utm_source=blazeboard" class="btn cta btn-yellow btn-large" title="Go to live wildfire map">
    <i class="fas fa-location-dot"></i>Explore fire activity
</a>

<main>
    <div class="column" id="left">
        <div class="grid highlight">
            <div class="card">
                <div class="card-content">
                    <h2>Total Incidents</h2>
                    <p class="stat" id="af"><span class="loading"></span></p>
                </div>
            </div>
            <div class="card">
                <div class="card-content">
                    <h2>Current Acres</h2>
                    <p class="stat" id="cb"><span class="loading"></span></p>
                </div>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <div class="card-content">
                    <h2>Human-Caused</h2>
                    <p class="stat" id="cause"><span class="loading"></span></p>
                </div>
            </div>
            <div class="card">
                <div class="card-content">
                    <h2>Nature-Caused</h2>
                    <p class="stat" id="cause2"><span class="loading"></span></p>
                </div>
            </div>
            <div class="card">
                <div class="card-content">
                    <h2>Personnel</h2>
                    <p class="stat" id="psnl"><span class="loading"></span></p>
                </div>
            </div>
            <div class="card">
                <div class="card-content">
                    <h2>YTD Cost</h2>
                    <p class="stat" id="cost"><span class="loading"></span></p>
                </div>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <div class="card-content">
                    <h2>Active</h2>
                    <p class="stat status active" id="act"><span class="loading"></span></p>
                </div>
            </div>
            <div class="card">
                <div class="card-content">
                    <h2>Contained</h2>
                    <p class="stat status contained" id="contain"><span class="loading"></span></p>
                </div>
            </div>
            <div class="card">
                <div class="card-content">
                    <h2>Controlled</h2>
                    <p class="stat status controlled" id="control"><span class="loading"></span></p>
                </div>
            </div>
            <div class="card">
                <div class="card-content">
                    <h2>Out</h2>
                    <p class="stat status out" id="out"><span class="loading"></span></p>
                </div>
            </div>
        </div>

        <hr>

        <div class="grid">
            <div class="card">
                <div class="card-content">
                    <h2>Fires by GACC</h2>
                    <select id="gacc" disabled>
                        <option>Loading...</option>
                    </select>
                    <p class="stat" id="gaccCount"><span class="loading"></span></p>
                </div>
            </div>
            <div class="card">
                <div class="card-content">
                    <h2>Acres by GACC</h2>
                    <p class="stat" id="gaccAcresCount"><span class="loading"></span></p>
                </div>
            </div>
            <div class="card">
                <div class="card-content">
                    <h2>Fires by Landowner</h2>
                    <select id="landowners" disabled>
                        <option selected value="federal">Federal</option>
                        <option value="state">State</option>
                        <option value="other">Other</option>
                    </select>
                    <p class="stat" id="landownerCount"><span class="loading"></span></p>
                </div>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <div class="card-content">
                    <h2>Fires in Timber</h2>
                    <p class="stat" id="timber"><span class="loading"></span></p>
                </div>
            </div>
            <div class="card">
                <div class="card-content">
                    <h2>Fires in Grass</h2>
                    <p class="stat" id="grass"><span class="loading"></span></p>
                </div>
            </div>
            <div class="card">
                <div class="card-content">
                    <h2>Fires in Brush</h2>
                    <p class="stat" id="brush"><span class="loading"></span></p>
                </div>
            </div>
            <div class="card">
                <div class="card-content">
                    <h2>Fires in Slash</h2>
                    <p class="stat" id="slash"><span class="loading"></span></p>
                </div>
            </div>
            <!--<div class="card">
                <div class="card-content">
                    <h2>Fuel: Other</h2>
                    <p class="stat" id="other"><span class="loading"></span></p>
                </div>
            </div>-->
        </div>
    </div>

    <div class="column" id="right">
        <hr class="screen">

        <div class="grid highlight">
            <div class="card" id="goToNewFires" style="cursor:pointer">
                <div class="card-content">
                    <h2>New Incidents</h2>
                    <p class="stat" id="newinc" style="color:var(--green)"><span class="loading"></span></p>
                </div>
            </div>
            <div class="card">
                <div class="card-content">
                    <h2>Wildfires</h2>
                    <p class="stat" id="type_wf"><span class="loading"></span></p>
                </div>
            </div>
            <div class="card">
                <div class="card-content">
                    <h2>Smoke Checks</h2>
                    <p class="stat" id="type_sc"><span class="loading"></span></p>
                </div>
            </div>
            <div class="card">
                <div class="card-content">
                    <h2>Prescribed Burns</h2>
                    <p class="stat" id="type_rx"><span class="loading"></span></p>
                </div>
            </div>
        </div>

        <div class="grid">
            <div class="tab-area">
                <ul class="tabs">
                    <li data-tab="largest">Largest Fires</li>
                    <li data-tab="new">New Fires</li>
                </ul>
                <div class="tab-content active" data-tab="largest">
                    <div class="card">
                        <div class="card-content">

                            <h2 class="filterable">
                                <span>Largest Wildfires</span>
                                <div>
                                    <i style="margin-right:4px;font-size:14px" class="far fa-filters"></i>
                                    <select id="typeFilter" size="1" multiple disabled>
                                        <option selected value="all">Wildfires</option>
                                        <option selected value="smk">Smoke Checks</option>
                                        <option selected value="rx">RX Burns</option>
                                    </select>
                                    <select id="sizeFilter" disabled>
                                        <option selected value="100">>100 acres</option>
                                        <option value="1000">>1,000 acres</option>
                                        <option value="10000">>10,000 acres</option>
                                    </select>
                                </div>
                            </h2>

                            <div class="table" id="wildfireList">
                                <span class="loading"></span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="tab-content" data-tab="new">
                    <div class="card">
                        <div class="card-content">
                            <h2 class="filterable"><span id="newFiresTitle">New Wildfires</span></h2>

                            <div class="table" id="newFiresList">
                                <span class="loading"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>