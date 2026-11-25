// ================= RULE HELPERS =================
const total = P => RES.reduce((s,r) => s + P.res[r], 0);
const vp = p => G.players[p].pueblos + 2*G.players[p].ciudades + vpCards(p) + (G.army === p ? 2 : 0) + (G.longest === p ? 2 : 0);
const afford = (p, cost) => Object.entries(cost).every(([r,n]) => G.players[p].res[r] >= n);
const pay = (p, cost) => { for (const r in cost) G.players[p].res[r] -= cost[r]; };
const tileName = t => TERRAIN[t.type].label + (t.num ? ' ' + t.num : '');
const resStr = obj => Object.entries(obj).map(([r,n]) => `${n} ${resImg(r)}`).join(', ');
function vscore(v){
  const set = new Set(); let s = 0;
  v.tiles.forEach(ti => { const t = G.tiles[ti]; s += pips(t.num); if (TERRAIN[t.type].res) set.add(TERRAIN[t.type].res); });
  return s + set.size * 0.6 + (v.port ? .9 : 0);
}
const distanceOK = v => !v.building && v.adj.every(a => !G.verts[a].building);
const hasOwnRoad = (p, v) => v.edges.some(e => G.edges[e].road === p);
const validSettlements = p => G.verts.filter(v => distanceOK(v) && hasOwnRoad(p, v));
const validCities = p => G.verts.filter(v => v.building && v.building.p === p && v.building.type === 'pueblo');
function validRoads(p){
  return G.edges.filter(e => e.road === null && [e.a, e.b].some(vid => {
    const v = G.verts[vid];
    if (v.building) return v.building.p === p;
    return v.edges.some(id => id !== e.id && G.edges[id].road === p);
  }));
}
function randomCard(P){ const bag = []; RES.forEach(r => { for (let i=0;i<P.res[r];i++) bag.push(r); }); return pick(bag); }

