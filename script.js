(function () {
  function initRainStyle() {
    const container = document.querySelector(".rg-services");
    if (!container) return false;

    const games = Array.from(container.querySelectorAll(".rg-game"));
    const blobWrap = container.querySelector("#rgBlobWrap");
    const blob = container.querySelector("#rgBlob");
    const glow = container.querySelector("#rgGlow");
    const blobContent = container.querySelector("#rgBlobContent");
    const blobTitle = document.querySelector("#rgBlobTitle");
    const leftCol = container.querySelector(".rg-left");

    if (!games.length || !blobWrap || !blob || !glow || !blobContent || !blobTitle || !leftCol) {
      console.log("RainStyle: elements missing");
      return false;
    }

    let currentY = 0;
    let currentTitle = "";

    let blockCenters = [];
    function calculateCenters() {
      const scrollTop = window.scrollY || window.pageYOffset;
      blockCenters = games.map((g, i) => {
        const rect = g.getBoundingClientRect();
        const offset = i === 0 ? rect.height * 0.2 : 0;
        return scrollTop + rect.top + rect.height / 2 - offset;
      });
    }
    calculateCenters();
    window.addEventListener('resize', ()=>{setTimeout(calculateCenters,200);});

    function lerp(a,b,t){return a+(b-a)*t;}
    
    function interpolateColor(c1,c2,t){
      if (!c1) c1 = "#f88236";
      if (!c2) c2 = "#f88236";
      
      const r1=parseInt(c1.slice(1,3),16), g1=parseInt(c1.slice(3,5),16), b1=parseInt(c1.slice(5,7),16);
      const r2=parseInt(c2.slice(1,3),16), g2=parseInt(c2.slice(3,5),16), b2=parseInt(c2.slice(5,7),16);
      
      return `rgb(${Math.round(lerp(r1,r2,t))}, ${Math.round(lerp(g1,g2,t))}, ${Math.round(lerp(b1,b2,t))})`;
    }
    
    function shapeLerp(shape1,shape2,t){
      const shapes={
        soft:[52,48,60,40,58,42,55,45],
        sharp:[40,60,50,50,45,55,60,40],
        fluid:[55,45,65,35,60,40,50,50]
      };
      
      const s1=shapes[shape1]||shapes.soft;
      const s2=shapes[shape2]||shapes.soft;
      const r=s1.map((v,i)=>lerp(v,s2[i],t));
    
      return `${r[0]}% ${r[1]}% ${r[2]}% ${r[3]}% / ${r[4]}% ${r[5]}% ${r[6]}% ${r[7]}%`;
    }

    function update(){
      const scrollTop = window.scrollY || window.pageYOffset;
      const viewportHeight = window.innerHeight;

      const minCenter = blockCenters[0];
      const maxCenter = blockCenters[blockCenters.length-1];
      let progress = (scrollTop + viewportHeight/2 - minCenter)/(maxCenter-minCenter);
      progress = Math.max(0, Math.min(progress, 1));

      const leftTop = leftCol.getBoundingClientRect().top + scrollTop;
      const firstCenterY = blockCenters[0] - leftTop;
      const lastCenterY = blockCenters[blockCenters.length-1] - leftTop;
      const targetY = lerp(firstCenterY, lastCenterY, progress) - blobWrap.offsetHeight/2;
      currentY += (targetY - currentY) * 0.08;
      
      blobWrap.style.transform = `translate3d(0, ${currentY.toFixed(2)}px, 0)`;

      let closest = 0, minDist = Infinity;
      const centerYScreen = scrollTop + viewportHeight/2;
      blockCenters.forEach((bc,i)=>{
        const dist = Math.abs(bc - centerYScreen); 
        if(dist < minDist){
          minDist = dist;
          closest = i;
        }
      });

      const nextIndex = Math.min(closest+1, games.length-1);
      const segmentStart = blockCenters[closest], segmentEnd = blockCenters[nextIndex];
      const t = segmentEnd - segmentStart === 0 ? 0 : (centerYScreen - segmentStart)/(segmentEnd - segmentStart);

      const color1 = games[closest].dataset.color || "#f88236";
      const color2 = games[nextIndex].dataset.color || "#f88236";
      const color = interpolateColor(color1, color2, t);
      
      blob.style.background = `radial-gradient(circle at 30% 30%, ${color}, #14181f 75%)`;
      glow.style.background = `radial-gradient(circle, ${color}55, transparent 70%)`;
      
      const shape1 = games[closest].dataset.shape || "soft";
      const shape2 = games[nextIndex].dataset.shape || "soft";
      blob.style.borderRadius = shapeLerp(shape1, shape2, t);

      const title = t < 0.5 ? games[closest].dataset.title : games[nextIndex].dataset.title;
      if(title && title !== currentTitle){
        blobContent.classList.remove("rg-fade-in");
        blobContent.classList.add("rg-fade-out");
        setTimeout(()=>{ 
          blobTitle.textContent = title; 
          blobContent.classList.remove("rg-fade-out"); 
          blobContent.classList.add("rg-fade-in"); 
        }, 260);
        currentTitle = title;
      }

      games.forEach((g,i)=>g.classList.toggle("rg-active", i === closest));

      glow.style.opacity = 0.7 + 0.15 * Math.sin(Date.now()/300);
      
      glow.style.transform = `scale(${1 + 0.03 * Math.sin(Date.now()/400)})`;

      requestAnimationFrame(update);
    }

    update();
    console.log("RainStyle: initialized");
    return true;
  }

  let tries = 0;
  const timer = setInterval(()=>{
    tries++;
    if(initRainStyle()) clearInterval(timer);
    if(tries > 50) clearInterval(timer);
  }, 200);
})();