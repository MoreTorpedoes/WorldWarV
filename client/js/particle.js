// World War V - Particles

var wwv = wwv || {};

wwv.particles = [];

wwv.fire_particle = function ( p, v, a, tint, alpha, t, sz, emit )
{
    var clone = function(p) { return { x: p.x, y: p.y, z: p.z }; };
    wwv.particles.push({
        p: clone(p),
        v: v ? clone(v) : { x: 0, y: 0, z: 0 },
        a: a ? clone(a) : { x: 0, y: 0, z: -1 },
        ang: Math.random() * 360.0,
        tint: tint ? tint : 0xffffff,
        alpha: alpha ? alpha : 1.0,
        t: t ? t : 1.0,
        sz: sz ? sz : Math.random() * 15 + 7.5,
        emit: emit
    });
};

wwv.prtDark = 0.0;
wwv.nuke_explosion = function ( p )
{
    wwv.prtDark += 1.0;
    for (var i=0; i<300; i++)
    {
        var a = Math.random()*Math.PI*2.0;
        var tints = [ 0xffffff, 0xff0000, 0xffff60, 0xff1010, 0xffff60, 0x808080 ];
        var a2 = Math.random()*Math.PI*2.0;
        var a3 = Math.random()*Math.PI*2.0;
        var r = Math.sqrt(Math.random()) * 35;
        wwv.fire_particle(
            { x: p.x + Math.cos(a2) * r * Math.sin(a3), y: p.y + Math.sin(a2) * r * Math.sin(a3) + 7, z: 2 },
            { x: Math.cos(a) * 5, y: Math.sin(a) * 5, z: 30.0 },
            { x: Math.cos(-a) * 12, y: Math.sin(-a) * 12, z: -10 },
            tints[Math.floor(Math.random()*tints.length)],
            1.0,
            2 + Math.random() * 4,
            Math.random() * 40 + 20,
            true
        );
    }
};

wwv.prtLastTime = null;
wwv.render_particles = function ( img )
{
    var game = wwv.game, W = wwv.W, H = wwv.H;
    var time = game.time.now / 1000;
    var dt = 0;
    if (wwv.prtLastTime)
        dt = time - wwv.prtLastTime;
    wwv.prtLastTime = time;
    var isNew = !img;
    var img = img ? img : game.make.bitmapData(W, H);
    img.clear();

    if (wwv.prtDark > 0)
        img.rect(0, 0, W, H, 'rgba(0,0,0,' + Math.min(wwv.prtDark, 1) + ')');
    wwv.prtDark -= Math.min(dt, 2.0) * wwv.prtDark * 0.5;

    var spr = game.make.sprite(0, 0, 'cloud');
    spr.anchor.set(0.5);

    var P = wwv.particles;

    for (var i=0; i<P.length; i++)
    {
        P[i].t -= dt;
        if (P[i].t <= 0)
        {
            P.splice(i, 1);
            i --;
            continue;
        }

        P[i].v.x += P[i].a.x * dt;
        P[i].v.y += P[i].a.y * dt;
        P[i].v.z += P[i].a.z * dt;
        P[i].p.x += P[i].v.x * dt;
        P[i].p.y += P[i].v.y * dt;
        P[i].p.z += P[i].v.z * dt;

        if (P[i].p.z < 0.1)
        {
            P[i].p.z = 0.1;
            P[i].v.z = -P[i].v.z * 0.3;
            P[i].a.z = -1;
        }

        P[i].ang += 360.0 * dt;
    
        spr.alpha = P[i].alpha * Math.min(P[i].t, 1.0);
        spr.scale.set(P[i].sz/128 * P[i].p.z / 60);
        spr.tint = P[i].tint;
        spr.angle = P[i].ang;
        img.draw(spr, P[i].p.x, P[i].p.y - P[i].p.z);

        if (P[i].emit && Math.random() < 0.15)
        {
            wwv.fire_particle(
                P[i].p,
                { x: Math.random() * 5 - 2.5 + P[i].v.x, y: Math.random() * 5 - 2.5 + P[i].v.y, z: Math.random() * 5 - 2.5 + P[i].v.z },
                null,
                0xffffff,
                0.3,
                P[i].t / 1.5,
                P[i].sz / 2.0
            );
        }
    }

    if (isNew)
        img.addToWorld().alpha = 1.0;
    return img;
};
