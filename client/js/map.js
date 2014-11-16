// WWV - Client Side - Map gen and render

var wwv = wwv || {};

// Client & server: Returns distance between two points
wwv.point_dist = function ( p1, p2 )
{
    return Math.sqrt((p1.x-p2.x)*(p1.x-p2.x) + (p1.y-p2.y)*(p1.y-p2.y));
};

// Client & server: Picks a random angle given a radius (acc) and offsets by (p)
wwv.rp_radius_offset = function ( p, acc )
{
    var r = acc;
    var a = Math.random() * Math.PI * 2.0;
    return { x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r };
};

// Server: Generates map & city locations & populations, with (players) 2-4, W and H no need to set in call
wwv.create_map = function ( players, W, H )
{
    if (!W) W = 800;
    if (!H) H = 800;
    if (!players) players = 2;

    var map = {
        C: null
    };

    var NC = players;
    var C = [];
    var CDIST = Math.min(W, H) / (2 * players*0.75);
    var CSIZE = CDIST / 2;
    
    var rand_point = function ( ) {
        var ret = {};
        ret.x = Math.random() * (W - CSIZE * 2) + CSIZE;
        ret.y = Math.random() * (H - CSIZE * 2) + CSIZE;
        return ret;
    };

    for (var i=0; i<NC; i++)
    {
        var p;
        var k = 10000;
        while (k--)
        {
            p = rand_point();
            var any = false;
            for (var j=0; j<C.length && !any; j++)
            {
                var P = wwv.point_dist(p, C[j]) / CDIST;
                if (P < 2.0 || P > 12.0)
                    any = true;
            }
            if (!any)
                break;
        }
        if (k <= 0)
            return wwv.create_map(players, W, H);
        C.push(p);
    }
    map.C = C;
    
    var NL = 200;
    var NS = 1;
    for (var i=0; i<NC; i++)
    {
        var L = [ {x: C[i].x, y: C[i].y, scale: NS } ];
        C[i].L = L;
    }

    var j;
    for (j=0; j<NL; j++)
    {
        NS *= 0.975;
        for (var c=0; c<C.length; c++)
        {
            var p;
            var k = 10000;
            while (k--)
            {
                p = rand_point();
                p.scale = NS;
                var any = false;
                var minMe = W*W;
                for (var i=0; i<C[c].L.length; i++)
                {
                    var P = wwv.point_dist(C[c].L[i], p);
                    minMe = Math.min(minMe, P);
                    if (P < (20*NS+20*C[c].L[i].scale))
                        any = true;
                }
                if (minMe > (5+80*NS))
                    any = true;
                for (var c2=0; c2<C.length && !any; c2++)
                {
                    if (c2 !== c)
                    {
                        for (var i=0; i<C[c2].L.length && !any; i++)
                        {
                            if (wwv.point_dist(C[c2].L[i], p) < CDIST)
                                any = true;
                        }
                    }
                }
                if (!any)
                {
                    C[c].L.push(p);
                    break;
                }
            }
            if (k <= 0)
            {
                j = NL;
                break;
            }
        }
    }

    var cities = [ 5, 4, 3 ];
    cities = cities[players - 2];
    var pop = [];

    for (var i=0; i<players; i++)
        pop.push(Math.random() * (1000000-100000) + 100000);

    for (var c=0; c<players; c++)
    {
        var L = [];
        for (var b=0; b<cities; b++)
        {
            var k = 10000;
            var chosen = null;
            while (chosen === null)
            {
                var idx = Math.floor(Math.random() * C[c].L.length);
                var green = Math.pow(1.0 - C[c].L[idx].scale, 0.5);
                if (green > 0.75)
                {
                    chosen = idx;
                    for (var i=0; i<L.length; i++)
                        if (wwv.point_dist(L[i], C[c].L[idx]) < (k<0 ? 15 : 100))
                            chosen = null;
                }
                k --;
                if (k <= 1)
                    return wwv.create_map(players, W, H);
            }
            L.push({
                x: C[c].L[chosen].x,
                y: C[c].L[chosen].y,
                pop: pop[b],
                cpop: pop[b]
            });
        }
        L.sort(function(a, b){
            var sca = Math.sqrt(a.pop / 100000) * 0.5 * 30;
            var scb = Math.sqrt(b.pop / 100000) * 0.5 * 30;
            return (a.y+sca) - (b.y+scb);
        });
        C[c].CIT = L;
    }

    console.log(map);
    
    return map;
};

// Server: Calculate target accuracy radius between (p1) and (p2) given (map) and (CL)ouds
wwv.calc_target_radius = function ( p1, p2, map, CL )
{
    var dist = 4.0;

    var DF = wwv.point_dist(p1, p2) / 50.0; // distance factor

    var len = wwv.point_dist(p1, p2);
    var dx = (p2.x - p1.x) / len;
    var dy = (p2.y - p1.y) / len;

    for (var D = 0.0; D < len; D += 15.0)
    {
        var p = { x: p1.x + dx * D, y: p1.y + dy * D };
        for (var c=0; c<map.C.length; c++)
            for (var i=0; i<map.C[c].L.length; i++)
            {
                var d = wwv.point_dist(map.C[c].L[i], p) - map.C[c].L[i].scale * 60;
                if (d < 0)
                {
                    var green = Math.pow(1.0 - map.C[c].L[i].scale, 0.5);
                        dist += (1.0 - green) * 3.0;
                }
            }
        for (var i=0; i<CL.length; i++)
        {
            var d = wwv.point_dist(CL[i], p) - CL[i].radius;
            if (d < 0)
            {
                dist += CL[i].radius / 128.0;
            }
        }
    }

    return Math.sqrt(dist) * DF;
};

// Server: Calculate a matrix of accuracy radii between all pairs of enemy cities given (map) and (CL)ouds
wwv.calc_all_tr = function ( map, CL )
{
    var atr = {};
    for (var c1=0; c1<map.C.length; c1++)
        for (var i1=0; i1<map.C[c1].CIT.length; i1++)
            for (var c2=0; c2<map.C.length; c2++)
                if (c2 > c1)
                    for (var i2=0; i2<map.C[c2].CIT.length; i2++)
                    {
                        var p1 = map.C[c1].CIT[i1];
                        var p2 = map.C[c2].CIT[i2];
                        var dist = wwv.calc_target_radius(p1, p2, map, CL);
                        if (dist > 175) dist = 175;
                        if (!atr[c1]) atr[c1] = {};
                        if (!atr[c1][i1]) atr[c1][i1] = {};
                        if (!atr[c1][i1][c2]) atr[c1][i1][c2] = {};
                        atr[c1][i1][c2][i2] = dist;
                        if (!atr[c2]) atr[c2] = {};
                        if (!atr[c2][i2]) atr[c2][i2] = {};
                        if (!atr[c2][i2][c1]) atr[c2][i2][c1] = {};
                        atr[c2][i2][c1][i1] = dist;
                    }
    return atr;
};

// Client: Calculate point in trajectory for display and nuke animation
wwv.trajectory_interp = function ( p1, p2, t )
{
    var t2 = Math.pow(Math.sin(Math.PI / 2.0 - Math.abs(t - 0.5) * 1.0 * Math.PI), 1.0);
    var z = wwv.point_dist(p1, p2) * t2 / 8.0;
    var p = {
        x: (p2.x - p1.x) * t + p1.x,
        y: (p2.y - p1.y) * t + p1.y - z,
        z: z,
        sy: (p2.y - p1.y) * t + p1.y
    };
    return p;
};

// Client: Render trajectory
wwv.render_trajectory = function ( T, bmd )
{
    var ctx = bmd.ctx;
    ctx.strokeStyle = '#ff0000';
    ctx.beginPath();
    ctx.moveTo(T[0].x, T[0].y);
    for (var i=1; i<T.length; i++)
        ctx.lineTo(T[i].x, T[i].y);
    ctx.stroke();
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(T[0].x, T[0].y);
    ctx.lineTo(T[T.length-1].x, T[T.length-1].y);
    ctx.stroke();
};

// Client: Compute 100 points on trajectory
wwv.generate_trajectory = function ( p1, p2 )
{
    var interp = function ( t )
    {
        return wwv.trajectory_interp(p1, p2, t);
    };

    var L = [];
    for (var t = 0.0; t <= 1.0; t += 1.0/100.0)
        L.push(interp(t));

    return L;
};

// Client: Render a map
wwv.render_map = function ( map, img )
{
    var game = wwv.game, W = wwv.W, H = wwv.H;
    var isNew = !img;
    var img = img ? img : game.make.bitmapData(W, H);
    img.clear();
    var spr = game.make.sprite(0, 0, 'tile-base');
    spr.anchor.set(0.5);
    var sprg = game.make.sprite(0, 0, 'tile-green');
    sprg.anchor.set(0.5);
    img.rect(0, 0, W, H, '#0020A0');
    for (var i=0; i<map.C.length; i++)
    {
        for (var j=map.C[i].L.length-1; j>=0; j--)
        {
            spr.scale.set(map.C[i].L[j].scale);
            var green = Math.pow(1.0 - map.C[i].L[j].scale, 0.5);
            spr.alpha = 1 - green;
            sprg.alpha = green;
            img.draw(spr, map.C[i].L[j].x, map.C[i].L[j].y);
            img.draw(sprg, map.C[i].L[j].x, map.C[i].L[j].y);
        }
    }
    var c1 = Math.floor(Math.random() * map.C.length);
    var c2 = (c1 + 1) % map.C.length;

    if (isNew)
        img.addToWorld();
    return img;
};

// Client: Render cities
wwv.render_cities = function ( map, img, HL, T, NK )
{
    if (!HL)
        HL = [];
    var game = wwv.game, W = wwv.W, H = wwv.H;
    var isNew = !img;
    var img = img ? img : game.make.bitmapData(W, H);
    img.clear();
    var sprb = game.make.sprite(0, 0, 'building');
    sprb.anchor.set(0.5);
    var sprd = game.make.sprite(0, 0, 'building-destroyed');
    sprd.anchor.set(0.5);
    
    for (var i=0; i<map.C.length; i++)
    {
        for (var j=0; j<map.C[i].CIT.length; j++)
        {
            var sc = Math.sqrt(map.C[i].CIT[j].pop / 100000) * 0.5;
            var dmg = 1.0 - (map.C[i].CIT[j].cpop / map.C[i].CIT[j].pop);
            if (map.C[i].CIT[j].dead)
            {
                sprd.scale.set(sc);
                img.draw(sprd, map.C[i].CIT[j].x, map.C[i].CIT[j].y);
            }
            else
            {
                sprb.scale.set(sc);
                sprb.tint = wwv.game_state.myTeam === i ? 0x70ff70 : 0xffffff;
                for (var k=0; k<HL.length; k++)
                    if (HL[k][0] === i && HL[k][1] === j)
                        sprb.tint = HL[k][2];
                img.draw(sprb, map.C[i].CIT[j].x, map.C[i].CIT[j].y);
            }
        }
        for (var j=0; j<map.C[i].CIT.length; j++)
        {
            if (map.C[i].CIT[j].dead)
                continue;
            for (var k=0; k<HL.length; k++)
                if (HL[k][0] === i && HL[k][1] === j && HL[k][3] >= 0)
                {
                    img.circle(map.C[i].CIT[j].x, map.C[i].CIT[j].y, HL[k][3], 'rgba(255,0,0,.25)');
                }
        }
    }
    if (T)
        wwv.render_trajectory(T, img);
    if (NK)
    {
        var spr = game.make.sprite(0, 0, 'nuke');
        spr.anchor.set(0.5);
        for (var i=0; i<NK.length; i++)
        {
             spr.scale.set(0.15);
             spr.angle = NK[i].a;
             spr.tint = 0;
             spr.alpha = 0.5;
             img.draw(spr, NK[i].x, NK[i].sy);

             spr.scale.set(NK[i].z * 1 + 0.15);
             spr.angle = NK[i].a;
             spr.tint = 0xffffff;
             spr.alpha = 1.0;
             img.draw(spr, NK[i].x, NK[i].y);
        }
    }
    if (isNew)
        img.addToWorld();
    return img;
};

// Server: Generate clouds (W) & (H) no need to set
wwv.generate_clouds = function ( W, H )
{
    if (!W) W = 800;
    if (!H) H = 800;
    
    var rand_point = function ( ) {
        var CSIZE = 0;
        var ret = {};
        ret.x = Math.random() * (W - CSIZE * 2) + CSIZE;
        ret.y = Math.random() * (H - CSIZE * 2) + CSIZE;
        return ret;
    };

    var L = [];
    var NC = Math.floor(Math.random()*800);
    var MCSZ = 128;

    while (NC--)
    {
        if (!L.length || Math.random() < 0.005)
        {
            var p = rand_point();
            p.radius = Math.random() * (MCSZ - 10) + 10;
            L.push(p);
        }
        else
        {
            var i = Math.floor(Math.random() * L.length);
            var r = Math.pow(Math.random(), 5.0) * L[i].radius * 10;
            var a = Math.random() * Math.PI * 2.0;
            var p = {
                x: L[i].x + Math.cos(a) * r,
                y: L[i].y + Math.sin(a) * r
            };
            p.radius = Math.random() * (MCSZ - 10) + 10;
            L.push(p);
        }
    }

    return L;
};

// Client: Render clouds
wwv.render_clouds = function ( list, img )
{
    var game = wwv.game, W = wwv.W, H = wwv.H;
    var isNew = !img;
    var img = img ? img : game.make.bitmapData(W, H);
    var spr = game.make.sprite(0, 0, 'cloud');
    img.clear();
    spr.anchor.set(0.5);
    spr.alpha = 0.2;
    for (var i=0; i<list.length; i++)
    {
        spr.angle = Math.random() * 360;
        spr.scale.set(list[i].radius/128);
        img.draw(spr, list[i].x, list[i].y);
    }
    if (isNew)
        img.addToWorld().alpha = 0.75;
    return img;
};
