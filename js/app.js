var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    parent: 'phaser-example',
    scene: {
        create: create
    }
};

var graph, w, h, l, center, text_x, text_y, move_graph;
var ease = null;
var textStyle = {color: '#000'};

var texts = {
    please_select: '... Please select a function to display',
    input: 'In',
    output: 'Out',
    instructions: 'Move mouse in this area',    
    params_placeholder: 'if the function accepts additional arguments, type them here separated by a comma',
    instructions_custom: 'type the body of your custom function here, use "v" as input argument',
    button_custom: 'Custom Function'
};

var game = new Phaser.Game(config);

function drawFunction(func, params) 
{   
    if(!/^[a-zA-Z]+(?:\.[a-zA-z]+)?$/.test(func)) {
        var _ease = new Function('v', func);
        try {
            var _r = _ease(0.5);
            if(_r === undefined || isNaN(_r)) return;
            ease = _ease;
        } catch (_exc) {
            console.log(_exc);
            return;
        }
    } else {
        func = func.split('.');
        ease = function(v) {        
            var _params;
            if(params === undefined || !params.length) {
                _params = [v];
            } else {
                _params = params.split(',').map(function(_x) {return parseFloat(_x.replace(/[^\d\.]+/g, ''));}).filter(function(_x) { return !isNaN(_x);});
                _params.unshift(v);
            }
            var _func = func.length > 1 ? Phaser.Math.Easing[func[0]][func[1]] : Phaser.Math.Easing[func[0]];
            return _func.apply(null, _params);      
        };
    }
    graph.clear();
    graph.lineStyle(2, 0xff0000, 1);
    graph.beginPath();
    graph.moveTo(center[0], center[1]);
    for(var i = 1; i <= l; i++) {
        var x = center[0] + i;
        var y = center[1] - ease((1 / l) * i) * l;
        graph.lineTo(x, y);
        graph.moveTo(x, y);
    }
    graph.strokePath();
}

function create ()
{
    w = this.sys.game.config.width;
    h = this.sys.game.config.height;
    center = [w * 0.25, h * 0.75];
    l = Math.min(w - center[0], center[1]) - 50;
    
    graph = this.add.graphics();
    var grid = this.add.graphics();
    grid.lineStyle(1, 0x000000, 0.2);
    for(var x1 = 0; x1 <= w; x1+= 10) {
        grid.lineBetween(x1, 0, x1, h);
    }
    for(var y1 = 0; y1 <= h; y1+= 10) {
        grid.lineBetween(0, y1, w, y1);
    }
    
    var arrows = this.add.graphics();
    arrows.lineStyle(2, 0x000000, 1);
    arrows.fillStyle(0x000000, 1);
    arrows.lineBetween(0, center[1], w, center[1]);
    arrows.lineBetween(center[0], 0, center[0], h); 
    arrows.fillTriangle(w - 10, center[1] - 10, w, center[1], w - 10, center[1] + 10);
    arrows.fillTriangle(center[0] - 10, 10, center[0], 0, center[0] + 10, 10);
    [[center[0], center[1]], [center[0] + l, center[1]], [center[0], center[1] - l], [center[0] + l, center[1] - l]].forEach(function(xy) {
        arrows.fillCircle(xy[0], xy[1], 3);
    });
    arrows.lineStyle(2, 0x000000, 0.3);
    arrows.lineBetween(center[0], center[1] - l, center[0] + l, center[1] - l);
    arrows.lineBetween(center[0] + l, center[1], center[0] + l, center[1] - l);
    
    this.add.text(center[0] - 12, center[1] + 2, '0', textStyle);
    this.add.text(center[0] + l + 3, center[1] - l - 16, '1', textStyle);
    this.add.text(center[0] / 2, center[1] - 15, texts.input, textStyle);
    this.add.text(center[0] - 15, (h + center[1]) / 2, texts.output, textStyle).setAngle(-90);
    this.add.text(center[0] + 80, h - 15, texts.instructions, textStyle);   
    text_x = this.add.text(0, 0, '0', textStyle).setVisible(false);
    text_y = this.add.text(0, 0, '0', textStyle).setVisible(false);
    move_graph = this.add.graphics();

    var funcSelectDiv = $('<div>').attr('id', 'funcSelectDiv').css('margin', '5px').appendTo('body');
    var funcSelect = $('<select>').attr('id', 'funcSelect').appendTo(funcSelectDiv);
    funcSelect.append($('<option>').attr('value', '').text(texts.please_select));
    var funcParams = $('<input>').attr('type', 'text').attr('placeholder', texts.params_placeholder).attr('id', 'funcParams').css({'marginLeft':'5px', 'width':'500px', 'fontSize':'12px'}).appendTo(funcSelectDiv);
    
    var customDiv = $('<div>').attr('id', 'customDiv').css('margin', '5px').appendTo('body');   
    var customText = $('<textarea>').attr('id', 'customText').attr('placeholder', texts.instructions_custom).appendTo(customDiv);
    var customButton = $('<input>').attr('type', 'button').attr('value', texts.button_custom).appendTo(customDiv);

    $(funcSelect).on('change', function() {
        drawFunction($(this).val(), $('#funcParams').val());
    });
    
    $(funcParams).on('change', function() {
        drawFunction($('#funcSelect').val(), $(this).val());
    });
    
    $(customButton).on('click', function() {
        if(!$('#customText').length) return;
        drawFunction($('#customText').val());
    });

    Object.keys(Phaser.Math.Easing).forEach(function(type) {            
        funcSelect.append($('<optgroup>').attr('label', type));
        var funcs = Object.keys(Phaser.Math.Easing[type]).concat([]);
        if(funcs.length < 1) funcs.push(false);
        funcs.forEach(function(func) {
            if(func === false) {
                var v = type;
                func = type;
            } else {
                var v= [type, func].join('.');
            }           
            funcSelect.append($("<option>").attr('value', v).text('> '+func));
        });
    });
    
    this.input.on('pointermove', function (pointer) {
        if(!ease) return;
        move_graph.clear();
        move_graph.lineStyle(1, 0xcd3232, 0.5);
        move_graph.fillStyle(0xcd3232, 0.5);
        
        if(pointer.x < center[0] || pointer.x > (center[0] + l)) {
            text_x.setVisible(false);
            text_y.setVisible(false);           
            return;
        }
        var _x = (pointer.x - center[0]) / l;
        var _y = ease(_x);
        var xc = [pointer.x, center[1]];
        var yc = [center[0], center[1] - _y * l];
        var on_graph = [pointer.x, center[1] - _y * l];
        [xc, yc, on_graph].forEach(function(point) {
            move_graph.fillCircle(point[0], point[1], 5);
        });
        text_x.setText(Phaser.Math.RoundTo(_x, -4)+'').setPosition(xc[0], xc[1] + 5).setVisible(true);
        text_y.setText(Phaser.Math.RoundTo(_y, -4)+'').setPosition(yc[0] - 65, yc[1]).setVisible(true);
    });
}
