window.TamilandaAI = (() => {
  function group(p) {
    if (!p) return 'Other';
    const cat = (p.category || p.sourceCategory || '').toLowerCase();
    const name = (p.name || '').toLowerCase();

    if (cat.includes('fountain') || cat.includes('flower') || name.includes('fountain')) return 'Fountains';
    if (cat.includes('sparkler') || name.includes('sparkler')) return 'Sparklers';
    if (cat.includes('shot') || cat.includes('sky') || name.includes('shot')) return 'Sky Shots';
    if (cat.includes('chakkar') || cat.includes('wheel') || name.includes('chakkar')) return 'Chakkars';
    if (cat.includes('kid') || name.includes('kid') || cat.includes('pop')) return 'Kids';
    if (cat.includes('cracker') || cat.includes('bomb') || cat.includes('garland') || name.includes('bomb')) return 'Crackers';
    return 'Other';
  }

  function recommend(smartState) {
    const products = window.TAMILANDA_PRODUCTS || [];
    const budget = Math.max(100, Number(smartState.budget) || 1000);
    const audience = smartState.audience || 'Family';

    let filtered = products.slice();
    if (audience === 'Kids') {
      const kidItems = filtered.filter(p => group(p) === 'Kids' || group(p) === 'Sparklers' || group(p) === 'Fountains');
      if (kidItems.length > 0) filtered = kidItems;
    }

    filtered.sort((a, b) => (a.price || 0) - (b.price || 0));

    const items = [];
    let total = 0;
    const selectedGroups = new Set();

    for (const p of filtered) {
      if (total + (p.price || 0) <= budget) {
        items.push(p);
        total += p.price || 0;
        selectedGroups.add(group(p));
      }
    }

    return {
      budget,
      total,
      items,
      groups: Array.from(selectedGroups)
    };
  }

  return { group, recommend };
})();
