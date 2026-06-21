/* NID Studios — hero nav clock.
   Sun/moon arc + Nidarosdomen silhouette + Trondheim local time.
   Kept in an external file so it complies with `script-src 'self'`
   (inline scripts are blocked by the site CSP). */
(function(){
  function trondheimContext(now){
    now = now || new Date();
    var fmt = function(opts){ return new Intl.DateTimeFormat('en-GB', Object.assign({timeZone:'Europe/Oslo', hour12:false}, opts)).format(now); };
    var hh = parseInt(fmt({hour:'2-digit'}),10);
    var mm = parseInt(fmt({minute:'2-digit'}),10);
    var localHour = hh + mm/60;
    var timeStr = String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
    var yearStart = new Date(now.getFullYear(),0,0);
    var dayOfYear = Math.floor((now - yearStart)/86400000);
    var lat = 63.4*Math.PI/180;
    var delta = 23.44*Math.PI/180*Math.sin(2*Math.PI*(dayOfYear-80)/365);
    var cosH = -Math.tan(lat)*Math.tan(delta);
    var sunrise, sunset, isDay, progress;
    if(cosH>1){ sunrise=12; sunset=12; isDay=false; progress=(localHour<12?localHour+12:localHour-12)/24; }
    else if(cosH<-1){ sunrise=0; sunset=24; isDay=true; progress=localHour/24; }
    else {
      var halfDay = Math.acos(cosH)*12/Math.PI;
      sunrise = 12-halfDay; sunset = 12+halfDay;
      isDay = localHour>=sunrise && localHour<=sunset;
      if(isDay){ progress=(localHour-sunrise)/(sunset-sunrise); }
      else { var nightLen=24-(sunset-sunrise); var ne=(localHour>sunset)?(localHour-sunset):(localHour+(24-sunset)); progress=ne/nightLen; }
    }
    return {timeStr:timeStr, isDay:isDay, progress:progress};
  }
  var SVGNS='http://www.w3.org/2000/svg';
  function el(name,attrs){ var e=document.createElementNS(SVGNS,name); for(var k in attrs){ e.setAttribute(k,attrs[k]); } return e; }
  function render(){
    var host = document.getElementById('clock');
    if(!host) return;
    var ctx = trondheimContext();
    var W=64,H=22,pad=5, horizonY=H-4, peakY=3;
    var x = pad + ctx.progress*(W-2*pad);
    var y = horizonY - (horizonY-peakY)*Math.sin(Math.PI*ctx.progress);
    host.innerHTML='';
    var svg = el('svg',{'class':'clock-arc',viewBox:'0 0 '+W+' '+H,width:W,height:H,'aria-hidden':'true'});
    svg.appendChild(el('line',{x1:pad-1,y1:horizonY,x2:W-pad+1,y2:horizonY,stroke:'currentColor','stroke-width':'0.5',opacity:'0.28'}));
    svg.appendChild(el('path',{d:'M '+pad+' '+horizonY+' Q '+(W/2)+' '+(peakY-4)+' '+(W-pad)+' '+horizonY,fill:'none',stroke:'currentColor','stroke-width':'0.4','stroke-dasharray':'1.2 2',opacity:'0.22'}));
    svg.appendChild(el('path',{'class':'clock-cathedral',d:'M 18 18 L 18 11 L 24 11 L 24 14 L 31.5 11 L 31.5 8 L 32 5 L 32.5 8 L 32.5 11 L 40 14 L 40 11 L 46 11 L 46 18 Z',fill:'currentColor',opacity:'0.55'}));
    if(ctx.isDay){
      var g = el('g',{'class':'clock-sun'});
      [0,45,90,135].forEach(function(a){
        g.appendChild(el('line',{x1:x-5,y1:y,x2:x+5,y2:y,transform:'rotate('+a+' '+x+' '+y+')',stroke:'var(--accent)','stroke-width':'0.55','stroke-linecap':'round',opacity:'0.55'}));
      });
      g.appendChild(el('circle',{cx:x,cy:y,r:'2.6',fill:'var(--accent)'}));
      svg.appendChild(g);
    } else {
      var defs = el('defs',{});
      var mask = el('mask',{id:'clock-crescent'});
      mask.appendChild(el('rect',{width:W,height:H,fill:'white'}));
      mask.appendChild(el('circle',{cx:x+1.8,cy:y-0.7,r:'2.5',fill:'black'}));
      defs.appendChild(mask); svg.appendChild(defs);
      svg.appendChild(el('circle',{cx:x,cy:y,r:'2.8',fill:'currentColor',mask:'url(#clock-crescent)'}));
    }
    host.appendChild(svg);
    var t=document.createElement('span'); t.className='clock-time'; t.textContent=ctx.timeStr; host.appendChild(t);
    var s=document.createElement('span'); s.className='clock-sep'; s.textContent='·'; host.appendChild(s);
    var l=document.createElement('span'); l.className='clock-loc'; l.textContent='Trondheim'; host.appendChild(l);
  }
  render();
  setInterval(render, 30000);
})();
