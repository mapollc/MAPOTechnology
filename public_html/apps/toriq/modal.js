const template = `<div id="drag-handle"></div>
<div class="wrapper">
    <div class="header">
        <div class="title">
            <h1>TornadoIQ Analysis</h1>
            <i id="close-modal" class="far fa-xmark"></i>
        </div>
        <ul class="tab-layout">
            <li data-name="details">Details</li>
            <li data-name="climatology">Climatology</li>
            <li data-name="risk">Your Risk</li>
        </ul>
    </div>
    <div class="content">
        <div class="tab-content">
            <div class="tab" data-name="details">
                <h2>Summary</h2>
                <div class="summary">
                    <div class="ibox">
                        <div class="badge ef5">
                            <i class="fat fa-tornado" style="font-size:1.5rem"></i>
                            <span class="rating">EF-{{mag}}</span>
                            <span class="winds">Winds: {{winds}} mph</span>
                        </div>
                    </div>
                    <div>
                        <div class="ef-scale" data-rating="{{mag}}">
                            <div class="ef-segment" data-ef="0" title="EF0"><span>EF-0</span></div>
                            <div class="ef-segment" data-ef="1" title="EF1"><span>EF-1</span></div>
                            <div class="ef-segment" data-ef="2" title="EF2"><span>EF-2</span></div>
                            <div class="ef-segment" data-ef="3" title="EF3"><span>EF-3</span></div>
                            <div class="ef-segment" data-ef="4" title="EF4"><span>EF-4</span></div>
                            <div class="ef-segment" data-ef="5" title="EF5"><span>EF-5</span></div>
                        </div>

                        <h3>Details</h3>
                        <div class="card">
                            <p><b>Date:</b> {{date}}</p>
                            <p><b>Time:</b> {{time}}</p>
                            <p><b>County:</b> {{county}} County, {{longState}}</p>
                        </div>
                        <h3>Impacts</h3>
                        <ul class="tor-grid" data-cols="4">
                            <li>
                                <h4>Fatalities</h4>
                                <span id="fat">{{deaths}}</span>
                            </li>
                            <li>
                                <h4>Injuries</h4>
                                <span id="inj">{{injuries}}</span>
                            </li>
                            <li>
                                <h4>Path Length</h4>
                                <span id="len">{{length}} mi</span>
                            </li>
                            <li>
                                <h4>Max Path Width</h4>
                                <span id="wid">{{width}} yds</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="tab" data-name="climatology">
                <h2>Tornado Probabilities for {{county}} County, {{stateAbbr}}</h2>

                <div class="msg info">
                    <p>These statistics are derived from historical and climatological tornado data specifically
                        for this county. They rely on certain assumptions and do not account for local
                        topography, recent climate change, or evolving meteorological patterns. <a href="#">Learn more</a>
                        about the methodology.</p>
                </div>

                <h3>Tornado Records ({{params.startYear}}&ndash;{{params.endYear}})</h3>
                <div class="columns">
                    <div>
                        <div id="count-chart" class="ct-chart" style="width:100%;height:300px"><div class="loading" title="Loading chart"></div></div>
                    </div>
                    <div>
                        <ul class="tor-grid" data-cols="4">
                            <li>
                                <h4>Total Tornadoes</h4>
                                <span id="counts-total">{{tornadoCounts.total}}</span>
                            </li>
                            <li>
                                <h4>EF-Unknown</h4>
                                <span id="counts-efu">{{tornadoCounts.efu}}</span>
                            </li>
                            <li>
                                <h4>EF-0</h4>
                                <span id="counts-ef0">{{tornadoCounts.ef0}}</span>
                            </li>
                            <li>
                                <h4>EF-1</h4>
                                <span id="counts-ef1">{{tornadoCounts.ef1}}</span>
                            </li>
                            <li>
                                <h4>EF-2</h4>
                                <span id="counts-ef2">{{tornadoCounts.ef2}}</span>
                            </li>
                            <li>
                                <h4>EF-3</h4>
                                <span id="counts-ef3">{{tornadoCounts.ef3}}</span>
                            </li>
                            <li>
                                <h4>EF-4</h4>
                                <span id="counts-ef4">{{tornadoCounts.ef4}}</span>
                            </li>
                            <li>
                                <h4>EF-5</h4>
                                <span id="counts-ef5">{{tornadoCounts.ef5}}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <h3>Tornado Lengths ({{params.startYear}}&ndash;{{params.endYear}})</h3>

                <div class="msg">
                    <p>Analyzed tornado track lengths, by magnitude, to discern a typical tornado track's length.</p>
                </div>

                <div class="lengths-chart">
                    {{{boxAndWhiskers}}}
                </div>

                <h3>Annual Occurrence Rate</h3>
                <div class="msg">
                    <p>These rates analyze how often a tornado is likely to occur in this county based on
                        climatological normals.</p>
                </div>
                <div class="columns" data-cols="3">
                    {{{rate}}}
                </div>

                <h3>Annual Probabilities</h3>
                <div class="columns" data-cols="3">
                    {{{probs}}}
                </div>

                <h3>Tornado Seasonality</h3>
                <div class="msg">
                    <p>Tornado seasons here are grouped by when tornadoes most commonly occur, rather than by
                        traditional meteorological seasons. This is computed by analyzing all tornadoes in the
                        US during the data period.</p>
                </div>

                <div id="seasonal-chart" class="ct-chart" style="width:100%;height:300px"><div class="loading" title="Loading chart"></div></div>

                <ul class="tor-grid" data-cols="4">
                    <li>
                        <h4>Highest Activity Season</h4>
                        <span id="spring-count">{{spring.pct}}%</span>
                        <span class="help">This season is defined as {{{spring.define}}}</span>
                    </li>
                    <li>
                        <h4>Warm Season</h4>
                        <span id="summer-count">{{summer.pct}}%</span>
                        <span class="help">This season is defined as {{{summer.define}}}</span>
                    </li>
                    <li>
                        <h4>Cold Season</h4>
                        <span id="fall-count">{{fall.pct}}%</span>
                        <span class="help">This season is defined as {{{fall.define}}}</span>
                    </li>
                    <li>
                        <h4>Lowest Activity Season</h4>
                        <span id="winter-count">{{winter.pct}}%</span>
                        <span class="help">This season is defined as {{{winter.define}}}</span>
                    </li>
                </ul>

            </div>
            <div class="tab" data-name="risk">
                <h2>Your Risk within {{county}} County, {{stateAbbr}}</h2>

                <div class="msg info">
                    <p>These statistics are derived from historical and climatological tornado data specifically
                        for this county. They rely on certain assumptions and do not account for local
                        topography, recent climate change, or evolving meteorological patterns. <a href="#">Learn more</a>
                        about the methodology.</p>
                </div>

                <h3>Your Overall Risk</h3>
                <div class="summary">
                    <div class="ibox">
                        <div id="risk-chart" class="ct-chart" style="width:100%;height:150px;overflow:hidden"><div class="loading" title="Loading chart"></div></div>
                    </div>
                    <div>
                        <p class="therisk">There is a <b>{{risk.value}}%</b> chance that a tornado of any magnitude will
                            occur within <u>5 miles</u> of the location you clicked on the map. Based on historical
                            data, we are 95% confident that this probability falls between <b>{{risk.lower}}%</b> and
                            <b>{{risk.upper}}%</b>.
                        </p>
                    </div>
                </div>

                <h3>Within 5 miles</h3>
                <div class="msg">
                    <p>These statistics are based on your relative risk within 5 miles of where you clicked on the map.</p>
                </div>

                <div class="columns" data-cols="3">
                    {{{risk.rate5}}}
                </div>

                <div class="columns" data-cols="3" style="margin-top:1em">
                    {{{risk.prob5}}}
                </div>

                <h3>Within 10 miles</h3>
                <div class="msg">
                    <p>These statistics are based on your relative risk within 10 miles of where you clicked on the map.</p>
                </div>

                <div class="columns" data-cols="3">
                    {{{risk.rate10}}}
                </div>

                <div class="columns" data-cols="3" style="margin-top:1em">
                    {{{risk.prob10}}}
                </div>

                <h3>Within 25 miles</h3>
                <div class="msg">
                    <p>These statistics are based on your relative risk within 25 miles of where you clicked on the map.</p>
                </div>

                <div class="columns" data-cols="3">
                    {{{risk.rate25}}}
                </div>

                <div class="columns" data-cols="3" style="margin-top:1em">
                    {{{risk.prob25}}}
                </div>
            </div>
        </div>
    </div>
</div>`;