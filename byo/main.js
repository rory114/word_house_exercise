
/*this time, you'll be writing your own variables. choose a word that you want
to substitute into a sentence, as was done with "red", "face", "think", 
"masculine", and "brain" earlier in the exercise

define it below by editing the line just below this comment
var word = "definition";

replace word with the word and definition with the definition
(see houseofwords/main.js for example)

then create your madlib using a template literal
madlib = `use your ${word} in a sentence in this format`;

inside the backticks (``), write your own sentence using your word
then wrap your word with ${ } so that the definition is subbed in
when the variable is deployed 

for more on template literals, see https://www.w3schools.com/js/js_string_templates.asp
*/

var word = "happy sad mad tired";
var madlib = `I am feeling ${word} today. `;

/* NEXT, you can add an object to your room if you like!
you have three objects to choose from: a chair, a bed, a fish
choose your object by naming assigning the variable object one of the following 
values (instead of null):

chair
bed
fish

do NOT put quotes around the the value
*/

var object = fish; 

var canvas = document.getElementById("renderCanvas");

var startRenderLoop = function (engine, canvas) {
    engine.runRenderLoop(function () {
        if (sceneToRender && sceneToRender.activeCamera) {
            sceneToRender.render();
        }
    });
}





var engine = null;
var scene = null;
var sceneToRender = null;
var createDefaultEngine = function () { return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, disableWebGL2Support: false }); };
BABYLON.PolygonMeshBuilder.prototype.wallBuilder = function (w0, w1) {
    var positions = [];
    var iuvs = [];
    var euvs = [];
    var icolors = [];
    var ecolors = [];
    var direction = w1.corner.subtract(w0.corner).normalize();
    var angle = Math.acos(direction.x);
    if (direction.z != 0) {
        angle *= direction.z / Math.abs(direction.z);
    }
    this._points.elements.forEach(function (p) {
        positions.push(p.x * Math.cos(angle) + w0.corner.x, p.y, p.x * Math.sin(angle) + w0.corner.z);
    });
    var indices = [];
    var res = earcut(this._epoints, this._eholes, 2);
    for (var i = res.length; i > 0; i--) {
        indices.push(res[i - 1]);
    };
    return { positions: positions, indices: indices };
};


var createScene = function () {
    var scene = new BABYLON.Scene(engine);
    // Skybox
	var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:1000.0}, scene);
	var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
	skyboxMaterial.backFaceCulling = false;
	skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/skybox", scene);
	skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
	skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
	skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
	skybox.material = skyboxMaterial;		
    // camera
    var cpos = new BABYLON.Vector3(-2.5, 2, 0);
    let tpos = new BABYLON.Vector3(4, 0, 0); //iniitial position
  

    camera = new BABYLON.FreeCamera("camera1", cpos, scene);
    camera.setTarget(tpos);
    camera.attachControl(canvas, true);

    //place object
    if(object){
        placeObject(object.folder, object.file, object.position, scene, object.scale, object.rotation);
    }
    var light = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(5, 10, 0), scene);
    light.intensity = 2; 
    var corner = function (x, y) {
        return new BABYLON.Vector3(x, 0, y);
    }

    var door = function (width, height) {
        this.width = width;
        this.height = height;
        this.left = 0;
    }

    var doorSpace = function (door, left) {
        this.door = door;
        this.left = left;
    }

    var window = function (width, height) {
        this.width = width;
        this.height = height;
        this.left = 0;
        this.bottom = 0;
    }

    var windowSpace = function (window, left, top) {
        this.window = window;
        this.left = left;
        this.top = top;
    }

    var wall = function (corner, doorSpaces, windowSpaces) {
        this.corner = corner;
        this.doorSpaces = doorSpaces || [];
        this.windowSpaces = windowSpaces || [];
    }


    //***********************************************************************************

    var baseData = [-3, -2, -1, -4, 1, -4, 3, -2, 5, -2, 5, 1, 2, 1, 2, 3, -3, 3];


    var corners = [];
    for (b = 0; b < baseData.length / 2; b++) {
        corners.push(new corner(baseData[2 * b], baseData[2 * b + 1]));
    }

    var floorprint = roofprint(corners, 0, 0);
    var floor = roofFloor(floorprint);
    var flooring = new BABYLON.StandardMaterial("floor", scene);
    flooring.diffuseTexture = new BABYLON.Texture("https://howshekilledit.github.io/houseofwords/models/floor.jpg", scene)

    floor.material = flooring;
    var door = new door(1, 1.8);
    var doorSpace = new doorSpace(door, 1);

    var window0 = new window(1.2, 2.4);
    var window1 = new window(2, 2.4);

    var windowSpace02 = new windowSpace(window0, 0.814, 0.4);
    var windowSpace1 = new windowSpace(window0, 0.4, 0.4);
    var windowSpace78 = new windowSpace(window1, 1.5, 0.4);

    var walls = [];
    for (c = 0; c < corners.length; c++) {
        walls.push(new wall(corners[c]));
    }

    walls[0].windowSpaces = [windowSpace02];
    walls[1].windowSpaces = [windowSpace1];
    walls[2].windowSpaces = [windowSpace02];
    walls[7].windowSpaces = [windowSpace78];
    walls[8].windowSpaces = [windowSpace78];

    walls[5].doorSpaces = [doorSpace];


    var ply = 0.3;
    var height = 3.2;

    var house = buildFromPlan(walls, ply, height, { interiorUV: new BABYLON.Vector4(0.167, 0, 1, 1), exteriorUV: new BABYLON.Vector4(0, 0, 0.16, 1) }, scene);

    var mat = buildMat(madlib, 60, 3500, 1000, "house", scene, "black");

    house.material = mat;

    return scene;

}
window.initFunction = async function () {


    var asyncEngineCreation = async function () {
        try {
            return createDefaultEngine();
        } catch (e) {
            console.log("the available createEngine function failed. Creating the default engine instead");
            return createDefaultEngine();
        }
    }

    window.engine = await asyncEngineCreation();
    if (!engine) throw 'engine should not be null.';
    startRenderLoop(engine, canvas);
    window.scene = createScene();
};
initFunction().then(() => {
    sceneToRender = scene
});

// Resize
window.addEventListener("resize", function () {
    engine.resize();
});
