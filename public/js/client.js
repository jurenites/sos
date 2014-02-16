(function(){
    alert('qew');
    var stats = new Stats();
    stats.setMode(1); // 0: fps, 1: ms

    // Align top-left
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';

    console.log(document);
    document.body.appendChild( stats.domElement );
    stats.begin();

    stats.end();
});