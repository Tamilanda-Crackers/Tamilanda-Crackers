(() => {
  const T = window.TAMILANDA_PRODUCTS || [];
  const clean = s => String(s || '').toLowerCase();
  const has = (p, words) => words.some(w => clean(p.name).includes(w) || clean(p.sourceCategory).includes(w));
  const group = p => {
    const c=clean(p.category), n=clean(p.name);
    if (c.includes('sparkler')) return 'Sparklers';
    if (c.includes('kids') || ['butterfly','helicopter','pogo','magic pops','electric stone','roll cap','baby gun','kids car','007 gun','duck','bus','cone ice cream','emu egg','photo flash'].some(x=>n.includes(x))) return 'Kids';
    if (c.includes('fountain') || c.includes('flower') || ['peacock','water queen','jasmine','rainbow smoke','shower','violet vampire','zombie','red bulls','lemon tree','mojito','jolly bobby','spooky'].some(x=>n.includes(x))) return 'Fountains';
    if (c.includes('chakkar') || n.includes('wheel') || n.includes('spinner')) return 'Chakkars';
    if (c.includes('sky') || n.includes('sky display') || /\bshot\b|niagara|seven step|turbo|purple rain|jungle party|sky copter|barbie/.test(n)) return 'Sky Shots';
    if (['cracker','bomb','wala','bijili','rocket'].some(x=>c.includes(x)) || ['sound','bomb','wala','bijili','kuruvi','lakshmi'].some(x=>n.includes(x))) return 'Crackers';
    return 'Other';
  };
  const attr = p => {
    const n=clean(p.name), g=group(p), x={kids:0,family:0,adult:0,sound:0,colour:0,premium:0,variety:0,value:0};
    if (g==='Kids') x.kids+=6;
    if (['Sparklers','Fountains','Chakkars','Sky Shots','Rockets'].includes(g)) {x.family+=4;x.colour+=4;x.variety+=3;x.value+=2}
    if (['Crackers','Bombs','Wala','Bijili'].some(v=>clean(p.category).includes(v)) || /sound|bomb|wala|bijili|kuruvi|lakshmi/.test(n)) {x.adult+=6;x.sound+=6;x.family+=3}
    if (/colour|color|flower|fountain|peacock|rainbow|smoke|shower|butterfly|sky|rocket|chakkar|wheel|spinner|sparkler/.test(n)) {x.colour+=5;x.variety+=2}
    if (/deluxe|prime|premium|mega|giant|jumbo|sony|vanitha|ajanta|ayyan|crystal|spooky|jolly/.test(n)) x.premium+=5;
    if (p.price <= 100) x.value+=5; else if (p.price <= 250) x.value+=3;
    x.variety += 2;
    return x;
  };
  function score(p, prefs) {
    const x=attr(p), n=clean(p.name), g=group(p); let s=0;
    const a=prefs.audience, o=prefs.objective;
    if (a==='Kids') s+=x.kids*10+x.colour*4-x.sound*5;
    if (a==='Family') s+=x.family*8+x.variety*5+x.colour*2-x.sound*1;
    if (a==='Adults') s+=x.adult*8+x.sound*9+x.colour*2+x.premium*2;
    if (a==='Everyone') s+=x.family*5+x.kids*4+x.adult*4+x.variety*6;
    if (o==='Balanced') s+=x.variety*7+x.family*3+x.colour*2;
    if (o==='Multipurpose') s+=x.variety*10+x.family*4+x.colour*3+x.sound*2;
    if (o==='Maximum Variety') s+=x.variety*11+x.value*2;
    if (o==='More Sound') s+=x.sound*13;
    if (o==='More Colour') s+=x.colour*13;
    if (o==='Premium') s+=x.premium*13+x.colour*2;
    if (o==='Budget Friendly') s+=x.value*10+x.variety*4;
    if (n.includes('combo')) s-=2;
    return s;
  }
  function recommend(prefs) {
    const budget=Math.max(100,Number(prefs.budget)||1000);
    const maxItems=budget<800?5:budget<1500?7:budget<3000?9:budget<5000?11:13;
    const pool=T.filter(p=>Number(p.price)<=budget).map(p=>({...p,_g:group(p),_s:score(p,prefs)})).sort((a,b)=>b._s-a._s);
    const wanted = prefs.objective==='More Sound' ? ['Crackers','Bombs','Wala','Bijili'] : prefs.objective==='More Colour' ? ['Fountains','Sparklers','Sky Shots','Chakkars'] : prefs.audience==='Kids' ? ['Kids','Sparklers','Fountains'] : prefs.audience==='Adults' ? ['Crackers','Sky Shots','Chakkars','Fountains'] : ['Crackers','Fountains','Sparklers','Chakkars','Sky Shots'];
    const chosen=[];const used=new Set();let total=0;
    const takeFrom=(arr)=>{for(const p of arr){if(chosen.length>=maxItems)break;if(used.has(p.id)||total+p.price>budget)continue;chosen.push(p);used.add(p.id);total+=p.price;break;}};
    wanted.forEach(g=>takeFrom(pool.filter(p=>p._g===g)));
    for(const p of pool){
      if(chosen.length>=maxItems || total>=budget*0.92) break;
      if(used.has(p.id)||total+p.price>budget) continue;
      const repeat=chosen.some(x=>x._g===p._g);
      const repeatPenalty=repeat && prefs.objective==='Maximum Variety' ? 8 : 0;
      if(p._s-repeatPenalty<=0) continue;
      chosen.push(p);used.add(p.id);total+=p.price;
    }
    // Fill to a strong budget utilisation without exceeding it.
    while(chosen.length<maxItems) {
      const next=pool.filter(p=>!used.has(p.id)&&total+p.price<=budget).sort((a,b)=>(b._s-b.price/50)-(a._s-a.price/50))[0];
      if(!next)break;chosen.push(next);used.add(next.id);total+=next.price;if(total>=budget*0.97)break;
    }
    return {items:chosen,total,budget,groups:[...new Set(chosen.map(p=>p._g))]};
  }
  window.TamilandaAI={group,attr,recommend};
})();
