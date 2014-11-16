// WWV - Client Side - Main

var wwv = wwv || {};

wwv.W = 800;
wwv.H = 800;

wwv.init = function ( )
{
    wwv.game = new Phaser.Game(wwv.W, wwv.H, Phaser.AUTO, 'game-container',
    {
        preload: wwv.preload,
        create:  wwv.create,
        update:  wwv.update
    });
};

wwv.preload = function ( )
{
    wwv.game.load.image('tile-base', 'img/tile-base.png');
    wwv.game.load.image('tile-green', 'img/tile-green.png');
    wwv.game.load.image('building', 'img/building.png');
    wwv.game.load.image('building-destroyed', 'img/building-destroyed.png');
    wwv.game.load.image('cloud', 'img/cloud.png');
    wwv.game.load.image('nuke', 'img/nuke.png');

    // game screens
    wwv.game.load.image('title', 'img/title.jpg');
    wwv.game.load.image('win-screen', 'img/win-screen.jpg');
    wwv.game.load.image('lose-screen', 'img/lose-screen.jpg');
};

wwv.game_state = {
    titleScreen: true,
    started: false,
    picking: true,
    myTeam: 0,
    selMine: null,
    selOther: null,
    selTraj: null,
    nukes: null,
    nukeStart: null
};

wwv.fireInfo = null;
wwv.test_fire_nuke = function ( )
{
    var GS = wwv.game_state;
    var M = wwv.map;
    if (GS.selMine && GS.selOther)
    {
        if (!wwv.fireInfo)
        {
            wwv.fireInfo = {
                t: 0.0,
                maxT: Math.random() * 0.5 + 0.5,
                dir: 3
            };
        }
        else
        {
            var p1 = M.C[GS.selMine[0]].CIT[GS.selMine[1]];
            var dmg = Math.random() * wwv.atr[GS.selMine[0]][GS.selMine[1]][GS.selOther[0]][GS.selOther[1]] * (1.0 - wwv.fireInfo.t);
            var p2 = 
                wwv.rp_radius_offset(
                    M.C[GS.selOther[0]].CIT[GS.selOther[1]],
                    dmg
                );
            nukes = [
                {
                    p1: p1,
                    p2: p2,
                    x: p1.x, y: p1.y,
                    a: 0,
                    z: 0.0,
                    lp: {
                        x: p1.x,
                        y: p1.y + 0.1
                    },
                    'dmg': 2500000 / (Math.max(10, Math.pow(dmg,2)/25)-10+1),
                    dmgC: GS.selOther
                }
            ];
            GS.picking = false;
            GS.nukes = nukes;
            GS.nukeStart = wwv.game.time.now / 1000.0;
            GS.selMine = null;
            GS.selOther = null;
            GS.selTraj = null;
            wwv.fireInfo = null;
        }
    }
},

wwv.lastTimeMain = null;
wwv.update = function ( )
{
    var dt = 0.0;
    var time = wwv.game.time.now/1000.0;
    if (wwv.lastTimeMain !== null)
        dt = time - wwv.lastTimeMain;
    wwv.lastTimeMain = time;

    var game = wwv.game;
    var hasClicked = !game.input.mousePointer.isDown && this.lastDown;

    if (wwv.game_state.picking && !wwv.fireInfo)
    {
        if (hasClicked)
        {
            var p = { x: game.input.x, y: game.input.y };
            var click = null, bdist = null;
            for (var c=0; c<wwv.map.C.length; c++)
            {
                var CIT = wwv.map.C[c].CIT;
                for (var i=0; i<CIT.length; i++)
                {
                    if (CIT[i].dead)
                        continue;
                    var dist = wwv.point_dist(p, CIT[i]);
                    if (dist < 25)
                    {
                        if (bdist === null || dist < bdist)
                        {
                            click = [ c, i ];
                            bdist = dist;
                        }
                    }
                }
            }

            if (click)
            {
                if (click[0] === wwv.game_state.myTeam)
                    wwv.game_state.selMine = click;
                else
                    wwv.game_state.selOther = click;

                var HL = [];
                if (wwv.game_state.selMine)
                    HL.push([wwv.game_state.selMine[0], wwv.game_state.selMine[1], 0x00ff00]);
                if (wwv.game_state.selOther)
                    HL.push([wwv.game_state.selOther[0], wwv.game_state.selOther[1], 0xff0000,
                        wwv.game_state.selMine ? wwv.atr[wwv.game_state.selMine[0]][wwv.game_state.selMine[1]][wwv.game_state.selOther[0]][wwv.game_state.selOther[1]] : 0
                    ]);
                if (HL.length === 2)
                {
                    wwv.game_state.selTraj = wwv.generate_trajectory(
                        wwv.map.C[wwv.game_state.selMine[0]].CIT[wwv.game_state.selMine[1]],
                        wwv.map.C[wwv.game_state.selOther[0]].CIT[wwv.game_state.selOther[1]]
                    );
                }
        
                wwv.cityImage = wwv.render_cities(wwv.map, wwv.cityImage, HL, wwv.game_state.selTraj);
            }
        }
    }
    else if (wwv.game_state.nukes)
    {
        var NK = wwv.game_state.nukes;

        var dt = wwv.game.time.now/1000.0 - wwv.game_state.nukeStart;

        for (var i=0; i<NK.length; i++)
        {
            var t = dt / (wwv.point_dist(NK[i].p1, NK[i].p2) / 100);
            if (t >= 1.0)
            {
                // explode

                wwv.nuke_explosion( NK[i] );

                var DC = NK[i].dmgC;
                var dmg = NK[i].dmg;
                var CIT = wwv.map.C[DC[0]].CIT[DC[1]];
                CIT.cpop -= dmg;
                if (CIT.cpop <= 0.0)
                {
                    CIT.dead = true;
                    wwv.nuke_explosion({
                        x: CIT.x,
                        y: CIT.y
                    });
                }

                NK.splice(i, 1);
                i--;
                continue;
            }
            var lp = { x: NK[i].x, y: NK[i].y };
            var np = wwv.trajectory_interp(NK[i].p1, NK[i].p2, t);
            NK[i].x = np.x;
            NK[i].y = np.y;
            NK[i].z = np.z / 60.0;
            NK[i].sy = np.sy;
            var p1 = lp, p2 = NK[i];
            NK[i].a = Math.atan2(p2.y-p1.y, p2.x-p1.x) * 180.0 / Math.PI + 90,
            NK[i].lp = lp;

            var a2 = (NK[i].a - 90) * Math.PI / 180.0;
            wwv.fire_particle( { x: NK[i].x - Math.cos(a2) * NK[i].z * 35, y: NK[i].sy - Math.sin(a2) * NK[i].z * 35, z: NK[i].z * 60.0 }, { x: Math.cos(a2), y: Math.sin(a2), z: 0.0 } );//, null, tint, alpha, t, sz );
            a2 += Math.random() * Math.PI / 2 - Math.PI / 4;
            wwv.fire_particle( { x: NK[i].x - Math.cos(a2) * NK[i].z * 20, y: NK[i].sy - Math.sin(a2) * NK[i].z * 20, z: NK[i].z * 60.0 }, { x: Math.cos(a2), y: Math.sin(a2), z: 0.0 }, null, 0xff0000, null, 0.75);
            a2 += Math.random() * Math.PI / 2 - Math.PI / 4;
            wwv.fire_particle( { x: NK[i].x - Math.cos(a2) * NK[i].z * 20, y: NK[i].sy - Math.sin(a2) * NK[i].z * 20, z: NK[i].z * 60.0 }, { x: Math.cos(a2), y: Math.sin(a2), z: 0.0 }, null, 0xffff00, null, 0.75);
        }

        wwv.cityImage = wwv.render_cities(wwv.map, wwv.cityImage, [], null, NK);

        if (NK.length === 0)
        {
            wwv.game_state.nukes = null;
            wwv.game_state.picking = true;
            wwv.clouds = wwv.generate_clouds(800, 800);
            wwv.cloudImg = wwv.render_clouds(wwv.clouds, wwv.cloudImg);
        }
    }
    else if (wwv.fireInfo)
    {
        wwv.fireInfo.t += dt * wwv.fireInfo.dir;
        if (wwv.fireInfo.dir > 0 && wwv.fireInfo.t > wwv.fireInfo.maxT)
        {
            wwv.fireInfo.t = wwv.fireInfo.maxT;
            wwv.fireInfo.maxT = Math.random() * 0.5 + 0.5;
            wwv.fireInfo.dir = -wwv.fireInfo.dir;
        }
        if (wwv.fireInfo.dir < 0 && wwv.fireInfo.t < 0)
        {
            wwv.fireInfo.t = 0;
            wwv.fireInfo.dir = -wwv.fireInfo.dir;
        }

        var HL = [];
        if (wwv.game_state.selMine)
            HL.push([wwv.game_state.selMine[0], wwv.game_state.selMine[1], 0x00ff00]);
        if (wwv.game_state.selOther)
            HL.push([wwv.game_state.selOther[0], wwv.game_state.selOther[1], 0xff0000,
                wwv.game_state.selMine ? wwv.atr[wwv.game_state.selMine[0]][wwv.game_state.selMine[1]][wwv.game_state.selOther[0]][wwv.game_state.selOther[1]] * (1.0 - wwv.fireInfo.t) : 0
            ]);
        if (HL.length === 2)
        {
            wwv.game_state.selTraj = wwv.generate_trajectory(
                wwv.map.C[wwv.game_state.selMine[0]].CIT[wwv.game_state.selMine[1]],
                wwv.map.C[wwv.game_state.selOther[0]].CIT[wwv.game_state.selOther[1]]
            );
        }

        wwv.cityImage = wwv.render_cities(wwv.map, wwv.cityImage, HL, wwv.game_state.selTraj);
    }
    
    var map = wwv.map;
    for (var i=0; i<map.C.length; i++)
    {
        for (var j=0; j<map.C[i].CIT.length; j++)
        {
            var dmg = 1.0 - (map.C[i].CIT[j].cpop / map.C[i].CIT[j].pop);
            if (map.C[i].CIT[j].dead)
                dmg = 1.0;
            if (Math.pow(Math.random(), 2.0) < dmg)
            {
                var a2 = Math.random() * Math.PI * 2.0;
                var r = Math.random();
                wwv.fire_particle( { x: map.C[i].CIT[j].x + Math.cos(a2) * r * 25, y: map.C[i].CIT[j].y + Math.sin(a2) * r * 25 + 20, z: 30 }, { x: Math.cos(a2), y: Math.sin(a2), z: 5.0 }, null, map.C[i].CIT[j].dead ? 0x808080 : 0xc0c0c0 );//, null, tint, alpha, t, sz );
            }
        }
    }

    wwv.prtImage = wwv.render_particles(wwv.prtImage);
    
    this.lastDown = game.input.mousePointer.isDown;
};

wwv.create = function ( )
{
    // this should be retrieved from the server
    // when the game starts
    wwv.map = wwv.create_map(4, 800, 800);
    wwv.clouds = wwv.generate_clouds(800, 800);
    wwv.atr = wwv.calc_all_tr(wwv.map, wwv.clouds);

    wwv.mapImg = wwv.render_map(wwv.map);
    wwv.cityImage = wwv.render_cities(wwv.map);
    wwv.prtImage = wwv.render_particles();
    wwv.cloudImg = wwv.render_clouds(wwv.clouds);
};
