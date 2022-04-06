//The roofprint is the footprint of the roof, it follows the floor plan of the house but is extended by the overlap
let renderList = []; 
let fan = {folder: 'https://models.babylonjs.com/vintageDeskFan/', 
file: "vintageFan_animated.gltf", scale:0.17, 
position: new BABYLON.Vector3(3, 0, -1),
rotation: new BABYLON.Vector3(0, -Math.PI/4, 0)};

let chair = {folder: "https://howshekilledit.github.io/houseofwords/models/", 
file: "chair.obj", scale:0.013, 
position: new BABYLON.Vector3(3, 0, -1),
rotation: new BABYLON.Vector3(0, -Math.PI/4, 0)};

let fish = {folder: "https://models.babylonjs.com/", 
file: "fish.glb", scale:0.35, 
position: new BABYLON.Vector3(3, 0.5, -2),
rotation: new BABYLON.Vector3(0,0, 0)};

var roofprint = function (corners, overlap, height) {
    var outerData = [];
    var angle = 0;
    var direction = 0;
    var line = BABYLON.Vector3.Zero();
    corners[1].subtractToRef(corners[0], line);
    var nextLine = BABYLON.Vector3.Zero();
    corners[2].subtractToRef(corners[1], nextLine);

    var nbCorners = corners.length;
    for (var c = 0; c < nbCorners; c++) {
        angle = Math.PI - Math.acos(BABYLON.Vector3.Dot(line, nextLine) / (line.length() * nextLine.length()));
        direction = BABYLON.Vector3.Cross(nextLine, line).normalize().y;
        lineNormal = new BABYLON.Vector3(line.z, 0, -1 * line.x).normalize();
        line.normalize();
        outerData[(c + 1) % nbCorners] = corners[(c + 1) % nbCorners].add(lineNormal.scale(overlap)).add(line.scale(direction * overlap / Math.tan(angle / 2)));
        outerData[(c + 1) % nbCorners].y = height
        line = nextLine.clone();
        corners[(c + 3) % nbCorners].subtractToRef(corners[(c + 2) % nbCorners], nextLine);
    }

    return outerData;
}
//https://doc.babylonjs.com/guidedLearning/workshop/roof#design-whole-roof
//The roof floor (or top ceiling of the house) created from the roofprint of the house
var roofFloor = function (roofprint) {
    var height = roofprint[0].y;
    var floor = BABYLON.MeshBuilder.CreatePolygon("polygon", { shape: roofprint, updatable: true, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
    var positions = floor.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    for (var p = 0; p < positions.length / 3; p++) {
        positions[3 * p + 1] = height + 0.01;
    }
    floor.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
    return floor;
}

//Creates the mesh roof structure 
var roof = function (roofprint, apexes, planes, rise, height, uvbase) {
    var positions = [];
    var uvs = [];

    var offset = roofprint.length;
    var vidx = [];
    var currentv = [];
    var v = [
        new BABYLON.Vector3(0, 0, 0),
        new BABYLON.Vector3(0, 0, 0),
        new BABYLON.Vector3(0, 0, 0),
        new BABYLON.Vector3(0, 0, 0)
    ]
    var vint = new BABYLON.Vector3(0, 0, 0);
    var indices = [];
    var index = 0;
    var norm = new BABYLON.Vector3(0, 0, 0);
    var inPlane = new BABYLON.Vector3(0, 0, 0);
    var ax0 = new BABYLON.Vector3(0, 0, 0);
    var ax1 = new BABYLON.Vector3(0, 0, 0);
    var xvalues = [];
    var yvalues = [];
    var uvs = [];
    var uvset = new Set();
    for (var i = 0; i < planes.length; i++) {
        for (var idx = 0; idx < 3; idx++) {
            vidx[idx] = parseInt(planes[i][idx].substring(1));
            if (planes[i][idx].substring(0, 1).toLowerCase() == "c") {
                positions.push(roofprint[vidx[idx]].x, roofprint[vidx[idx]].y, roofprint[vidx[idx]].z)
                indices.push(index);
            }
            else {
                positions.push(apexes[vidx[idx]].x, rise + height, apexes[vidx[idx]].y);
                indices.push(index);
            }
            currentv[idx] = index;
            v[idx].set(positions[3 * index], positions[3 * index + 1], positions[3 * index + 2]);
            index++;
        }

        if (planes[i].length == 4) {
            if (planes[i][0].substring(0, 1).toLowerCase() == "c") {
                positions.push(roofprint[vidx[0]].x, roofprint[vidx[0]].y, roofprint[vidx[0]].z)
                indices.push(index);
            }
            else {
                positions.push(apexes[vidx[0]].x, rise + height, apexes[vidx[0]].y);
                indices.push(index);
            }
            currentv[idx] = index;
            v[idx].set(positions[3 * index], positions[3 * index + 1], positions[3 * index + 2]);
            index++;
            for (var idx = 2; idx < 4; idx++) {
                vidx[idx] = parseInt(planes[i][idx].substring(1));
                if (planes[i][idx].substring(0, 1).toLowerCase() == "c") {
                    positions.push(roofprint[vidx[idx]].x, roofprint[vidx[idx]].y, roofprint[vidx[idx]].z)
                    indices.push(index);
                }
                else {
                    positions.push(apexes[vidx[idx]].x, rise + height, apexes[vidx[idx]].y);
                    indices.push(index);
                }
                currentv[idx] = index;
                v[idx].set(positions[3 * index], positions[3 * index + 1], positions[3 * index + 2]);
                index++;
            }
        }
        ax0 = v[1].subtract(v[0]).normalize();

        if (BABYLON.Vector3.Dot(ax0, BABYLON.Axis.Y) > 0) {
            vint = v[1].subtract(v[2]);
            vint.y = 0;
            ax0 = v[0].add(vint).normalize();
        }
        ax1 = v[2].subtract(v[0]).normalize();
        norm = BABYLON.Vector3.Cross(ax0, ax1).normalize();
        inPlane = BABYLON.Vector3.Cross(norm, ax0).normalize();
        xvalues[0] = 0;
        yvalues[0] = 0;
        xvalues[1] = BABYLON.Vector3.Dot(v[1].subtract(v[0]), ax0);
        yvalues[1] = BABYLON.Vector3.Dot(v[1].subtract(v[0]), inPlane);
        xvalues[2] = BABYLON.Vector3.Dot(v[2].subtract(v[0]), ax0);
        yvalues[2] = BABYLON.Vector3.Dot(v[2].subtract(v[0]), inPlane);

        minX = Math.min(xvalues[0], xvalues[1], xvalues[2]);
        if (planes[i].length == 4) {
            xvalues[3] = BABYLON.Vector3.Dot(v[3].subtract(v[0]), ax0);
            yvalues[3] = BABYLON.Vector3.Dot(v[3].subtract(v[0]), inPlane);
            minX = Math.min(minX, xvalues[3]);
        }
        for (var idx = 0; idx < 3; idx++) {
            if (minX < 0) {
                xvalues[idx] += Math.abs(minX);
            }
            uvs.push(xvalues[idx] / uvbase, yvalues[idx] / uvbase);
        }
        if (planes[i].length == 4) {
            uvs.push(xvalues[0] / uvbase, yvalues[0] / uvbase);
            uvs.push(xvalues[2] / uvbase, yvalues[2] / uvbase);
            if (minX < 0) {
                xvalues[3] += Math.abs(minX);
            }
            uvs.push(xvalues[3] / uvbase, yvalues[3] / uvbase);
        }
    }

    var roofMesh = new BABYLON.Mesh("roof", scene);

    var normals = [];

    var vertexData = new BABYLON.VertexData();
    BABYLON.VertexData.ComputeNormals(positions, indices, normals);



    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.uvs = uvs;
    vertexData.applyToMesh(roofMesh);

    return roofMesh;
}


var buildFromPlan = function (walls, ply, height, options, scene, label = "house ") {


    //Arrays for vertex positions and indices
    var positions = [];
    var indices = [];
    var uvs = [];
    var colors = [];

    var interiorUV = options.interiorUV || new BABYLON.Vector4(0, 0, 1, 1);
    var exteriorUV = options.exteriorUV || new BABYLON.Vector4(0, 0, 1, 1);

    var interiorColor = options.interiorColor || new BABYLON.Color4(1, 1, 1, 1);
    var exteriorColor = options.exteriorColor || new BABYLON.Color4(1, 1, 1, 1);
    var interior = options.interior || false;
    if (!interior) {
        walls.push(walls[0]);
    }

    var interiorIndex;

    //Arrays to hold wall corner data 
    var innerBaseCorners = [];
    var outerBaseCorners = [];
    var innerTopCorners = [];
    var outerTopCorners = [];
    var innerDoorCorners = [];
    var outerDoorCorners = [];
    var innerWindowCorners = [];
    var outerWindowCorners = [];

    var angle = 0;
    var direction = 0;

    var line = BABYLON.Vector3.Zero();
    var nextLine = BABYLON.Vector3.Zero();

    var nbWalls = walls.length;
    if (nbWalls === 2) {
        walls[1].corner.subtractToRef(walls[0].corner, line);
        lineNormal = new BABYLON.Vector3(line.z, 0, -1 * line.x).normalize();
        line.normalize();
        innerBaseCorners[0] = walls[0].corner;
        outerBaseCorners[0] = walls[0].corner.add(lineNormal.scale(ply));
        innerBaseCorners[1] = walls[1].corner;
        outerBaseCorners[1] = walls[1].corner.add(lineNormal.scale(ply));
    }
    else if (nbWalls > 2) {
        for (var w = 0; w < nbWalls - 1; w++) {
            walls[w + 1].corner.subtractToRef(walls[w].corner, nextLine);
            angle = Math.PI - Math.acos(BABYLON.Vector3.Dot(line, nextLine) / (line.length() * nextLine.length()));
            direction = BABYLON.Vector3.Cross(nextLine, line).normalize().y;
            lineNormal = new BABYLON.Vector3(line.z, 0, -1 * line.x).normalize();
            line.normalize();
            innerBaseCorners[w] = walls[w].corner
            outerBaseCorners[w] = walls[w].corner.add(lineNormal.scale(ply)).add(line.scale(direction * ply / Math.tan(angle / 2)));
            line = nextLine.clone();
        }
        if (interior) {
            lineNormal = new BABYLON.Vector3(line.z, 0, -1 * line.x).normalize();
            line.normalize();
            innerBaseCorners[nbWalls - 1] = walls[nbWalls - 1].corner
            outerBaseCorners[nbWalls - 1] = walls[nbWalls - 1].corner.add(lineNormal.scale(ply));
            walls[1].corner.subtractToRef(walls[0].corner, line);
            lineNormal = new BABYLON.Vector3(line.z, 0, -1 * line.x).normalize();
            line.normalize();
            innerBaseCorners[0] = walls[0].corner;
            outerBaseCorners[0] = walls[0].corner.add(lineNormal.scale(ply));
        }
        else {
            walls[1].corner.subtractToRef(walls[0].corner, nextLine);
            angle = Math.PI - Math.acos(BABYLON.Vector3.Dot(line, nextLine) / (line.length() * nextLine.length()));
            direction = BABYLON.Vector3.Cross(nextLine, line).normalize().y;
            lineNormal = new BABYLON.Vector3(line.z, 0, -1 * line.x).normalize();
            line.normalize();
            innerBaseCorners[0] = walls[0].corner
            outerBaseCorners[0] = walls[0].corner.add(lineNormal.scale(ply)).add(line.scale(direction * ply / Math.tan(angle / 2)));
            innerBaseCorners[nbWalls - 1] = innerBaseCorners[0];
            outerBaseCorners[nbWalls - 1] = outerBaseCorners[0]

        }
    }

    // inner and outer top corners
    for (var w = 0; w < nbWalls; w++) {
        innerTopCorners.push(new BABYLON.Vector3(innerBaseCorners[w].x, height, innerBaseCorners[w].z));
        outerTopCorners.push(new BABYLON.Vector3(outerBaseCorners[w].x, height, outerBaseCorners[w].z));
    }

    var maxL = 0;

    for (w = 0; w < nbWalls - 1; w++) {
        maxL = Math.max(innerBaseCorners[w + 1].subtract(innerBaseCorners[w]).length(), maxL);
    }
    
    var maxH = height; // for when gables introduced



    /******House Mesh Construction********/

    // Wall Construction
    var polygonCorners;
    var polygonTriangulation;
    var wallData;
    var wallDirection = BABYLON.Vector3.Zero();
    var wallNormal = BABYLON.Vector3.Zero();
    var wallLength;
    var exteriorWallLength;
    var doorData;
    var windowData;
    var uvx, uvy;
    var wallDiff;

    for (var w = 0; w < nbWalls - 1; w++) {

        walls[w + 1].corner.subtractToRef(walls[w].corner, wallDirection);
        wallLength = wallDirection.length();
        wallDirection.normalize();
        wallNormal.x = wallDirection.z;
        wallNormal.z = -1 * wallDirection.x;

        exteriorWallLength = outerBaseCorners[w + 1].subtract(outerBaseCorners[w]).length();
        wallDiff = exteriorWallLength - wallLength;
        var gableHeight = 0;

        //doors
        if (walls[w].doorSpaces) {
            walls[w].doorSpaces.sort(compareLeft);
        }
        var doors = walls[w].doorSpaces.length;

        //Construct INNER wall polygon starting from (0, 0) using wall length and height and door data
        polygonCorners = [];
        polygonCorners.push(new BABYLON.Vector2(0, 0));

        for (var d = 0; d < doors; d++) {
            polygonCorners.push(new BABYLON.Vector2(walls[w].doorSpaces[d].left, 0));
            polygonCorners.push(new BABYLON.Vector2(walls[w].doorSpaces[d].left, walls[w].doorSpaces[d].door.height));
            polygonCorners.push(new BABYLON.Vector2(walls[w].doorSpaces[d].left + walls[w].doorSpaces[d].door.width, walls[w].doorSpaces[d].door.height));
            polygonCorners.push(new BABYLON.Vector2(walls[w].doorSpaces[d].left + walls[w].doorSpaces[d].door.width, 0));
        }

        polygonCorners.push(new BABYLON.Vector2(wallLength, 0));
        polygonCorners.push(new BABYLON.Vector2(wallLength, height));
        polygonCorners.push(new BABYLON.Vector2(0, height));










        //Construct triangulation of polygon using its corners
        polygonTriangulation = new BABYLON.PolygonMeshBuilder("", polygonCorners, scene);

        //windows
        //Construct holes and add to polygon from window data			
        var windows = walls[w].windowSpaces.length;
        var holes = [];
        for (var ws = 0; ws < windows; ws++) {
            var holeData = [];
            holeData.push(new BABYLON.Vector2(walls[w].windowSpaces[ws].left, height - walls[w].windowSpaces[ws].top - walls[w].windowSpaces[ws].window.height));
            holeData.push(new BABYLON.Vector2(walls[w].windowSpaces[ws].left + walls[w].windowSpaces[ws].window.width, height - walls[w].windowSpaces[ws].top - walls[w].windowSpaces[ws].window.height));
            holeData.push(new BABYLON.Vector2(walls[w].windowSpaces[ws].left + walls[w].windowSpaces[ws].window.width, height - walls[w].windowSpaces[ws].top));
            holeData.push(new BABYLON.Vector2(walls[w].windowSpaces[ws].left, height - walls[w].windowSpaces[ws].top));
            holes.push(holeData);
        }

        for (var h = 0; h < holes.length; h++) {
            polygonTriangulation.addHole(holes[h]);
        }


        // wallBuilder produces wall vertex positions array and indices using the current and next wall to rotate and translate vertex positions to correct place
        wallData = polygonTriangulation.wallBuilder(walls[w], walls[w + 1]);

        nbIndices = positions.length / 3; // current number of indices

        polygonTriangulation._points.elements.forEach(function (p) {
            uvx = interiorUV.x + p.x * (interiorUV.z - interiorUV.x) / maxL;
            uvy = interiorUV.y + p.y * (interiorUV.w - interiorUV.y) / height;
            uvs.push(uvx, uvy);
            colors.push(interiorColor.r, interiorColor.g, interiorColor.b, interiorColor.a);
        });

        //Add inner wall positions (repeated for flat shaded mesh)
        positions = positions.concat(wallData.positions);

        interiorIndex = positions.length / 3;

        indices = indices.concat(wallData.indices.map(function (idx) {
            return idx + nbIndices;
        }));

        //wallData has format for inner wall [base left, 0 or more doors, base right, top right, top left, windows]
        //extract door and wall data

        windowData = wallData.positions.slice(12 * (doors + 1)); //4 entries per door + 4 entries for wall corners, each entry has 3 data points
        doorData = wallData.positions.slice(3, 3 * (4 * doors + 1));

        //For each inner door save corner as an array of four Vector3s, base left, top left, top right, base right
        //Extend door data outwards by ply and save outer door corners 		
        var doorCornersIn = [];
        var doorCornersOut = [];
        for (var p = 0; p < doorData.length / 12; p++) {
            var doorsIn = [];
            var doorsOut = [];
            for (var d = 0; d < 4; d++) {
                doorsIn.push(new BABYLON.Vector3(doorData[3 * d + 12 * p], doorData[3 * d + 12 * p + 1], doorData[3 * d + 12 * p + 2]));
                doorData[3 * d + 12 * p] += ply * wallNormal.x;
                doorData[3 * d + 12 * p + 2] += ply * wallNormal.z;
                doorsOut.push(new BABYLON.Vector3(doorData[3 * d + 12 * p], doorData[3 * d + 12 * p + 1], doorData[3 * d + 12 * p + 2]));
            }
            doorCornersIn.push(doorsIn);
            doorCornersOut.push(doorsOut);
        }
        innerDoorCorners.push(doorCornersIn);
        outerDoorCorners.push(doorCornersOut);

        //For each inner window save corner as an array of four Vector3s, base left, top left, top right, base right
        //Extend window data outwards by ply and save outer window corners 		
        var windowCornersIn = [];
        var windowCornersOut = [];
        for (var p = 0; p < windowData.length / 12; p++) {
            var windowsIn = [];
            var windowsOut = [];
            for (var d = 0; d < 4; d++) {
                windowsIn.push(new BABYLON.Vector3(windowData[3 * d + 12 * p], windowData[3 * d + 12 * p + 1], windowData[3 * d + 12 * p + 2]));
                windowData[3 * d + 12 * p] += ply * wallNormal.x;
                windowData[3 * d + 12 * p + 2] += ply * wallNormal.z;
                windowsOut.push(new BABYLON.Vector3(windowData[3 * d + 12 * p], windowData[3 * d + 12 * p + 1], windowData[3 * d + 12 * p + 2]));
            }
            windowCornersIn.push(windowsIn);
            windowCornersOut.push(windowsOut);
        }
        innerWindowCorners.push(windowCornersIn);
        outerWindowCorners.push(windowCornersOut);

        //Construct OUTER wall facet positions from inner wall 
        //Add outer wall corner positions back to wallData positions
        wallData.positions = [];

        wallData.positions.push(outerBaseCorners[w].x, outerBaseCorners[w].y, outerBaseCorners[w].z);
        wallData.positions = wallData.positions.concat(doorData);
        wallData.positions.push(outerBaseCorners[w + 1].x, outerBaseCorners[w + 1].y, outerBaseCorners[(w + 1) % nbWalls].z);
        wallData.positions.push(outerTopCorners[w + 1].x, outerTopCorners[w + 1].y, outerTopCorners[(w + 1) % nbWalls].z);
        wallData.positions.push(outerTopCorners[w].x, outerTopCorners[w].y, outerTopCorners[w].z);
        wallData.positions = wallData.positions.concat(windowData);

        //Calulate exterior wall uvs
        polygonTriangulation._points.elements.forEach(function (p) {
            if (p.x == 0) {
                uvx = exteriorUV.x;
            }
            else if (wallLength - p.x < 0.000001) {
                uvx = exteriorUV.x + (wallDiff + p.x) * (exteriorUV.z - exteriorUV.x) / (maxL + wallDiff)
            }
            else {
                uvx = exteriorUV.x + (0.5 * wallDiff + p.x) * (exteriorUV.z - exteriorUV.x) / (maxL + wallDiff);
            }
            uvy = exteriorUV.y + p.y * (exteriorUV.w - exteriorUV.y) / height;
            uvs.push(uvx, uvy);
        });

        nbIndices = positions.length / 3; // current number of indices

        //Add outer wall positions, uvs and colors (repeated for flat shaded mesh)
        positions = positions.concat(wallData.positions);


        //Reverse indices for correct normals
        wallData.indices.reverse();

        indices = indices.concat(wallData.indices.map(function (idx) {
            return idx + nbIndices;
        }));

        //Construct facets for base and door top and door sides, repeating positions for flatshaded mesh
        var doorsRemaining = doors;
        var doorNb = 0;

        if (doorsRemaining > 0) {
            //base
            nbIndices = positions.length / 3; // current number of indices

            positions.push(innerBaseCorners[w].x, innerBaseCorners[w].y, innerBaseCorners[w].z); //tl
            positions.push(outerBaseCorners[w].x, outerBaseCorners[w].y, outerBaseCorners[w].z); //bl
            positions.push(innerDoorCorners[w][doorNb][0].x, innerDoorCorners[w][doorNb][0].y, innerDoorCorners[w][doorNb][0].z); //tr
            positions.push(outerDoorCorners[w][doorNb][0].x, outerDoorCorners[w][doorNb][0].y, outerDoorCorners[w][doorNb][0].z); //br

            uvs.push(exteriorUV.x, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * ply / maxH); //top Left
            uvs.push(exteriorUV.x, exteriorUV.y); //base Left				
            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * walls[w].doorSpaces[doorNb].left / maxL, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * ply / maxH); //top right
            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * walls[w].doorSpaces[doorNb].left / maxL, exteriorUV.y); //base right

            indices.push(nbIndices, nbIndices + 2, nbIndices + 3, nbIndices + 3, nbIndices + 1, nbIndices);

            //left side
            nbIndices = positions.length / 3; // current number of indices

            positions.push(innerDoorCorners[w][doorNb][0].x, innerDoorCorners[w][doorNb][0].y, innerDoorCorners[w][doorNb][0].z); //br
            positions.push(innerDoorCorners[w][doorNb][1].x, innerDoorCorners[w][doorNb][1].y, innerDoorCorners[w][doorNb][1].z); //tr
            positions.push(outerDoorCorners[w][doorNb][0].x, outerDoorCorners[w][doorNb][0].y, outerDoorCorners[w][doorNb][0].z); //bl
            positions.push(outerDoorCorners[w][doorNb][1].x, outerDoorCorners[w][doorNb][1].y, outerDoorCorners[w][doorNb][1].z); //tl

            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * ply / maxL, exteriorUV.y); //base right
            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * ply / maxL, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * walls[w].doorSpaces[doorNb].door.height / maxH); //top right
            uvs.push(exteriorUV.x, exteriorUV.y); //base Left
            uvs.push(exteriorUV.x, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * walls[w].doorSpaces[doorNb].door.height / maxH); //top Left

            indices.push(nbIndices, nbIndices + 1, nbIndices + 3, nbIndices, nbIndices + 3, nbIndices + 2);

            //top
            nbIndices = positions.length / 3; // current number of indices

            positions.push(innerDoorCorners[w][doorNb][1].x, innerDoorCorners[w][doorNb][1].y, innerDoorCorners[w][doorNb][1].z); //bl
            positions.push(innerDoorCorners[w][doorNb][2].x, innerDoorCorners[w][doorNb][2].y, innerDoorCorners[w][doorNb][2].z); //br
            positions.push(outerDoorCorners[w][doorNb][1].x, outerDoorCorners[w][doorNb][1].y, outerDoorCorners[w][doorNb][1].z); //tl
            positions.push(outerDoorCorners[w][doorNb][2].x, outerDoorCorners[w][doorNb][2].y, outerDoorCorners[w][doorNb][2].z); //tr

            uvs.push(exteriorUV.x, exteriorUV.y); //base Left
            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * walls[w].doorSpaces[doorNb].door.width / maxL, exteriorUV.y); //base right
            uvs.push(exteriorUV.x, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * ply / maxH); //top Left
            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * walls[w].doorSpaces[doorNb].door.width / maxL, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * ply / maxH); //top right

            indices.push(nbIndices + 2, nbIndices + 1, nbIndices + 3, nbIndices + 2, nbIndices, nbIndices + 1);

            //right side
            nbIndices = positions.length / 3; // current number of indices

            positions.push(innerDoorCorners[w][doorNb][2].x, innerDoorCorners[w][doorNb][2].y, innerDoorCorners[w][doorNb][2].z); //tl
            positions.push(innerDoorCorners[w][doorNb][3].x, innerDoorCorners[w][doorNb][3].y, innerDoorCorners[w][doorNb][3].z); //bl
            positions.push(outerDoorCorners[w][doorNb][2].x, outerDoorCorners[w][doorNb][2].y, outerDoorCorners[w][doorNb][2].z); //tr
            positions.push(outerDoorCorners[w][doorNb][3].x, outerDoorCorners[w][doorNb][3].y, outerDoorCorners[w][doorNb][3].z); //br

            uvs.push(exteriorUV.x, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * walls[w].doorSpaces[doorNb].door.height / maxH); //top Left
            uvs.push(exteriorUV.x, exteriorUV.y); //base Left
            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * ply / maxL, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * walls[w].doorSpaces[doorNb].door.height / maxH); //top right
            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * ply / maxL, exteriorUV.y); //base right

            indices.push(nbIndices, nbIndices + 3, nbIndices + 2, nbIndices, nbIndices + 1, nbIndices + 3);
        }
        doorsRemaining--
        doorNb++

        while (doorsRemaining > 0) {

            //base
            nbIndices = positions.length / 3; // current number of indices

            positions.push(innerDoorCorners[w][doorNb - 1][3].x, innerDoorCorners[w][doorNb - 1][3].y, innerDoorCorners[w][doorNb - 1][3].z); //bl
            positions.push(innerDoorCorners[w][doorNb][0].x, innerDoorCorners[w][doorNb][0].y, innerDoorCorners[w][doorNb][0].z); //br
            positions.push(outerDoorCorners[w][doorNb - 1][3].x, outerDoorCorners[w][doorNb - 1][3].y, outerDoorCorners[w][doorNb - 1][3].z); //tl
            positions.push(outerDoorCorners[w][doorNb][0].x, outerDoorCorners[w][doorNb][0].y, outerDoorCorners[w][doorNb][0].z); //tr

            uvs.push(exteriorUV.x, exteriorUV.y); //base Left
            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * (walls[w].doorSpaces[doorNb].left - (walls[w].doorSpaces[doorNb - 1].left + walls[w].doorSpaces[doorNb - 1].door.width)) / maxL / maxL, exteriorUV.y); //base right
            uvs.push(exteriorUV.x, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * ply / maxH); //top Left
            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * (walls[w].doorSpaces[doorNb].left - (walls[w].doorSpaces[doorNb - 1].left + walls[w].doorSpaces[doorNb - 1].door.width)) / maxL, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * ply / maxH); //top right

            indices.push(nbIndices, nbIndices + 1, nbIndices + 3, nbIndices + 3, nbIndices + 2, nbIndices);

            //left side
            nbIndices = positions.length / 3; // current number of indices

            positions.push(innerDoorCorners[w][doorNb][0].x, innerDoorCorners[w][doorNb][0].y, innerDoorCorners[w][doorNb][0].z); //br
            positions.push(innerDoorCorners[w][doorNb][1].x, innerDoorCorners[w][doorNb][1].y, innerDoorCorners[w][doorNb][1].z); //tr
            positions.push(outerDoorCorners[w][doorNb][0].x, outerDoorCorners[w][doorNb][0].y, outerDoorCorners[w][doorNb][0].z); //bl
            positions.push(outerDoorCorners[w][doorNb][1].x, outerDoorCorners[w][doorNb][1].y, outerDoorCorners[w][doorNb][1].z); //tl

            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * ply / maxL, exteriorUV.y); //base right
            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * ply / maxL, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * walls[w].doorSpaces[doorNb].door.height / maxH); //top right
            uvs.push(exteriorUV.x, exteriorUV.y); //base Left
            uvs.push(exteriorUV.x, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * walls[w].doorSpaces[doorNb].door.height / maxH); //top Left

            indices.push(nbIndices, nbIndices + 1, nbIndices + 3, nbIndices, nbIndices + 3, nbIndices + 2);

            //top
            nbIndices = positions.length / 3; // current number of indices

            positions.push(innerDoorCorners[w][doorNb][1].x, innerDoorCorners[w][doorNb][1].y, innerDoorCorners[w][doorNb][1].z); //bl
            positions.push(innerDoorCorners[w][doorNb][2].x, innerDoorCorners[w][doorNb][2].y, innerDoorCorners[w][doorNb][2].z); //br
            positions.push(outerDoorCorners[w][doorNb][1].x, outerDoorCorners[w][doorNb][1].y, outerDoorCorners[w][doorNb][1].z); //tl
            positions.push(outerDoorCorners[w][doorNb][2].x, outerDoorCorners[w][doorNb][2].y, outerDoorCorners[w][doorNb][2].z); //tr

            uvs.push(exteriorUV.x, exteriorUV.y); //base Left
            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * walls[w].doorSpaces[doorNb].door.width / maxL, exteriorUV.y); //base right
            uvs.push(exteriorUV.x, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * ply / maxH); //top Left
            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * walls[w].doorSpaces[doorNb].door.width / maxL, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * ply / maxH); //top right

            indices.push(nbIndices + 2, nbIndices + 1, nbIndices + 3, nbIndices + 2, nbIndices, nbIndices + 1);

            //right side
            nbIndices = positions.length / 3; // current number of indices

            positions.push(innerDoorCorners[w][doorNb][2].x, innerDoorCorners[w][doorNb][2].y, innerDoorCorners[w][doorNb][2].z); //tl
            positions.push(innerDoorCorners[w][doorNb][3].x, innerDoorCorners[w][doorNb][3].y, innerDoorCorners[w][doorNb][3].z); //bl
            positions.push(outerDoorCorners[w][doorNb][2].x, outerDoorCorners[w][doorNb][2].y, outerDoorCorners[w][doorNb][2].z); //tr
            positions.push(outerDoorCorners[w][doorNb][3].x, outerDoorCorners[w][doorNb][3].y, outerDoorCorners[w][doorNb][3].z); //br

            uvs.push(exteriorUV.x, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * walls[w].doorSpaces[doorNb].door.height / maxH); //top Left
            uvs.push(exteriorUV.x, exteriorUV.y); //base Left
            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * ply / maxL, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * walls[w].doorSpaces[doorNb].door.height / maxH); //top right
            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * ply / maxL, exteriorUV.y); //base right

            indices.push(nbIndices, nbIndices + 3, nbIndices + 2, nbIndices, nbIndices + 1, nbIndices + 3);

            doorsRemaining--
            doorNb++

        }

        doorNb--;
        nbIndices = positions.length / 3; // current number of indices

        //final base
        if (doors > 0) {
            positions.push(innerDoorCorners[w][doorNb][3].x, innerDoorCorners[w][doorNb][3].y, innerDoorCorners[w][doorNb][3].z); //bl
            positions.push(innerBaseCorners[w + 1].x, innerBaseCorners[w + 1].y, innerBaseCorners[w + 1].z); //br
            positions.push(outerDoorCorners[w][doorNb][3].x, outerDoorCorners[w][doorNb][3].y, outerDoorCorners[w][doorNb][3].z); //tl
            positions.push(outerBaseCorners[w + 1].x, outerBaseCorners[w + 1].y, outerBaseCorners[w + 1].z); //tr

            uvs.push(exteriorUV.x, exteriorUV.y); //base Left
            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * (wallLength - (walls[w].doorSpaces[doorNb].left + walls[w].doorSpaces[doorNb].door.width)) / maxL, exteriorUV.y); //base right
            uvs.push(exteriorUV.x, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * ply / maxH); //top Left
            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * (wallLength - (walls[w].doorSpaces[doorNb].left + walls[w].doorSpaces[doorNb].door.width)) / maxL, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * ply / maxH); //top right

        }
        else {
            positions.push(innerBaseCorners[w].x, innerBaseCorners[w].y, innerBaseCorners[w].z); //bl
            positions.push(innerBaseCorners[w + 1].x, innerBaseCorners[w + 1].y, innerBaseCorners[w + 1].z); //br
            positions.push(outerBaseCorners[w].x, outerBaseCorners[w].y, outerBaseCorners[w].z); //tl
            positions.push(outerBaseCorners[w + 1].x, outerBaseCorners[w + 1].y, outerBaseCorners[w + 1].z); //tr

            uvs.push(exteriorUV.x, exteriorUV.y); //base Left
            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * wallLength / maxL, exteriorUV.y); //base right
            uvs.push(exteriorUV.x, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * ply / maxH); //top Left
            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * wallLength / maxL, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * ply / maxH); //top right

        }
        indices.push(nbIndices, nbIndices + 1, nbIndices + 3, nbIndices + 3, nbIndices + 2, nbIndices);

        //Construct facets for window base, top and sides, repeating positions for flatshaded mesh
        for (ww = 0; ww < innerWindowCorners[w].length; ww++) {
            //left side
            nbIndices = positions.length / 3; // current number of indices

            positions.push(innerWindowCorners[w][ww][3].x, innerWindowCorners[w][ww][3].y, innerWindowCorners[w][ww][3].z); //tr
            positions.push(innerWindowCorners[w][ww][0].x, innerWindowCorners[w][ww][0].y, innerWindowCorners[w][ww][0].z); //br
            positions.push(outerWindowCorners[w][ww][3].x, outerWindowCorners[w][ww][3].y, outerWindowCorners[w][ww][3].z); //tl
            positions.push(outerWindowCorners[w][ww][0].x, outerWindowCorners[w][ww][0].y, outerWindowCorners[w][ww][0].z); //bl

            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * ply / maxL, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * walls[w].windowSpaces[ww].window.height / maxH); //top right
            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * ply / maxL, exteriorUV.y); //base right
            uvs.push(exteriorUV.x, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * walls[w].windowSpaces[ww].window.height / maxH); //top Left
            uvs.push(exteriorUV.x, exteriorUV.y); //base Left

            indices.push(nbIndices + 1, nbIndices, nbIndices + 3, nbIndices + 2, nbIndices + 3, nbIndices);

            //base
            nbIndices = positions.length / 3; // current number of indices

            positions.push(innerWindowCorners[w][ww][0].x, innerWindowCorners[w][ww][0].y, innerWindowCorners[w][ww][0].z); //tl
            positions.push(innerWindowCorners[w][ww][1].x, innerWindowCorners[w][ww][1].y, innerWindowCorners[w][ww][1].z); //tr
            positions.push(outerWindowCorners[w][ww][0].x, outerWindowCorners[w][ww][0].y, outerWindowCorners[w][ww][0].z); //bl
            positions.push(outerWindowCorners[w][ww][1].x, outerWindowCorners[w][ww][1].y, outerWindowCorners[w][ww][1].z); //br

            uvs.push(exteriorUV.x, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * ply / maxH); //top Left
            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * walls[w].windowSpaces[ww].window.width / maxL, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * ply / maxH); //top right
            uvs.push(exteriorUV.x, exteriorUV.y); //base Left
            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * walls[w].windowSpaces[ww].window.width / maxL, exteriorUV.y); //base right

            indices.push(nbIndices + 1, nbIndices, nbIndices + 3, nbIndices + 3, nbIndices, nbIndices + 2);

            //right side
            nbIndices = positions.length / 3; // current number of indices

            positions.push(innerWindowCorners[w][ww][1].x, innerWindowCorners[w][ww][1].y, innerWindowCorners[w][ww][1].z); //bl
            positions.push(innerWindowCorners[w][ww][2].x, innerWindowCorners[w][ww][2].y, innerWindowCorners[w][ww][2].z); //tl
            positions.push(outerWindowCorners[w][ww][1].x, outerWindowCorners[w][ww][1].y, outerWindowCorners[w][ww][1].z); //br
            positions.push(outerWindowCorners[w][ww][2].x, outerWindowCorners[w][ww][2].y, outerWindowCorners[w][ww][2].z); //tr

            uvs.push(exteriorUV.x, exteriorUV.y); //base Left
            uvs.push(exteriorUV.x, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * walls[w].windowSpaces[ww].window.height / maxH); //top Left
            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * ply / maxL, exteriorUV.y); //base right
            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x), exteriorUV.y + (exteriorUV.w - exteriorUV.y) * walls[w].windowSpaces[ww].window.height / maxH); //top right

            indices.push(nbIndices + 1, nbIndices + 2, nbIndices + 3, nbIndices, nbIndices + 2, nbIndices + 1);

            //top
            nbIndices = positions.length / 3; // current number of indices

            positions.push(innerWindowCorners[w][ww][2].x, innerWindowCorners[w][ww][2].y, innerWindowCorners[w][ww][2].z); //br
            positions.push(innerWindowCorners[w][ww][3].x, innerWindowCorners[w][ww][3].y, innerWindowCorners[w][ww][3].z); //bl
            positions.push(outerWindowCorners[w][ww][2].x, outerWindowCorners[w][ww][2].y, outerWindowCorners[w][ww][2].z); //tr
            positions.push(outerWindowCorners[w][ww][3].x, outerWindowCorners[w][ww][3].y, outerWindowCorners[w][ww][3].z); //tl

            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * walls[w].windowSpaces[ww].window.width / maxL, exteriorUV.y); //base right
            uvs.push(exteriorUV.x, exteriorUV.y); //base Left
            uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * walls[w].windowSpaces[ww].window.width / maxL, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * ply / maxH); //top right
            uvs.push(exteriorUV.x, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * ply / maxH); //top Left

            indices.push(nbIndices + 3, nbIndices, nbIndices + 2, nbIndices + 1, nbIndices, nbIndices + 3);

        }

        //Construction of top of wall facets
        nbIndices = positions.length / 3; // current number of indices

        positions.push(innerTopCorners[w].x, innerTopCorners[w].y, innerTopCorners[w].z); //tl
        positions.push(innerTopCorners[w + 1].x, innerTopCorners[w + 1].y, innerTopCorners[w + 1].z); //tr
        positions.push(outerTopCorners[w].x, outerTopCorners[w].y, outerTopCorners[w].z); //bl
        positions.push(outerTopCorners[w + 1].x, outerTopCorners[w + 1].y, outerTopCorners[w + 1].z); //br

        uvx = exteriorUV.x + 0.5 * wallDiff * (exteriorUV.z - exteriorUV.x) / maxL;
        uvs.push(uvx, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * ply / maxH); //top Left

        uvx = exteriorUV.x + (0.5 * wallDiff + wallLength) * (exteriorUV.z - exteriorUV.x) / maxL;
        uvs.push(uvx, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * ply / maxH); //top right

        uvs.push(exteriorUV.x, exteriorUV.y); //base Left		
        uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * exteriorWallLength / (maxL + wallDiff), exteriorUV.y); //base right

        indices.push(nbIndices + 1, nbIndices, nbIndices + 3, nbIndices + 2, nbIndices + 3, nbIndices);

        for (var p = interiorIndex; p < positions.length / 3; p++) {
            colors.push(exteriorColor.r, exteriorColor.g, exteriorColor.b, exteriorColor.a);
        }

        var compareLeft = function (a, b) {
            return a.left - b.left
        }

    }

    var normals = [];

    BABYLON.VertexData.ComputeNormals(positions, indices, normals);
    BABYLON.VertexData._ComputeSides(BABYLON.Mesh.FRONTSIDE, positions, indices, normals, uvs);


    //Create a custom mesh  
    var customMesh = new BABYLON.Mesh("custom", scene);

    //Create a vertexData object
    var vertexData = new BABYLON.VertexData();

    //Assign positions and indices to vertexData
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.uvs = uvs;
    vertexData.colors = colors;

    //Apply vertexData to custom mesh
    vertexData.applyToMesh(customMesh);
    var newmat = buildMat(`${label} `, 30, 2000, 1000, "house", scene, "blue");
    customMesh.material = newmat; 

    return customMesh;


}
//***********************************************************************************

//cover wallpaper with text
function textTure(text, texture, fontSize, cWidth, cHeight, color, flip = true) {
    var textPos = 0; //current position in text
    //roughly calculate number of lines needed to cover wall
    var nLines = 0.7 * cHeight / fontSize;
    //roughly caluclate number of repetitions needed to cover wall
    var textReps = Math.ceil((cWidth * cHeight) / (text.length * fontSize));
    var coverText = `${text.repeat(textReps)}`;
    var lnLen = 1.8 * cWidth / (fontSize); //rough length of each line of text
    var font = `${fontSize}px Monospace`;
    var wallColor = new BABYLON.Color3(1, 1, 1);
    var numred = 0;
    let clearColor = new BABYLON.Color4(0, 0, 0, 0);
    for (var i = 0; i < nLines; i++) {
        var thisLine = coverText.substr(textPos, lnLen);
        thisLine = thisLine.substr(0, thisLine.lastIndexOf(" "));
        textPos += thisLine.length;
        if (i == 0) {
            texture.drawText(thisLine, 410, 50 + i * fontSize * 1.5, font, color, "#f0ead6")
        } else {
            texture.drawText(thisLine, 410, 50 + i * fontSize * 1.5, font, color);
            var linePos = thisLine.indexOf(text); //position of full madlib in this line
            if (linePos > 1 & numred < 3) {
                texture.drawText(`${' '.repeat(linePos)}${text}`, 410, 50 + i * fontSize * 1.5, font, 'red');
                numred++;
            }
        }
    }
    console.log(texture);
    if(flip){
        texture.vAng = Math.PI; 
    }
    //texture.invertX = true; 
    return texture; 


}

//load and place object in scene
function placeObject(folder, file, position, scene, scale = 1, rotation = new BABYLON.Vector3(0, 0, 0), texture = new BABYLON.Color3(0.5, 0.5, 0.5)){
 
    let object = BABYLON.SceneLoader.ImportMesh(
        null,
         folder,
        file,
        scene,
        function (meshes) { 
            //var mat = new BABYLON.StandardMaterial('colormat', scene);
           // mat.diffuseColor = new BABYLON.Color3(clr.r, clr.g, clr.b);
           
           for (const mesh of meshes) { 
            mesh.position = position;
            mesh.rotation = rotation;
            //meshes[0].rotation.x += MATH.PI/2; 
            mesh.scaling = new BABYLON.Vector3(scale, scale, scale);
            let mat = new BABYLON.StandardMaterial("coke material", scene);
            mat.diffuseColor = texture;
            mesh.material = mat; 
            renderList.push(mesh);
    
           }
         
           
                     
    });
    console.log(object);
    return object;

}

//3d text
function threeDText(str, position, scene, rotation = new BABYLON.Vector3(0,0,0), fontSize = 0.3, cWidth = 3, cHeight = 5, scale = 1, maxWidth = 4) {
    Writer = BABYLON.MeshWriter(scene, { scale: scale });
    str = `${str.repeat(4)}`


    var text = new Writer(
        str,
        {
            "anchor":  position,
            "letter-height": fontSize,
            "letter-thickness": fontSize / 2,
            "color": "#000080",

        }
    );

    //Text Writer create SPS with Particle for each letter
    var SPS = text.getSPS();

    /*Update animation
    SPS.updateParticle =  (particle)=> {
        particle.rotation.z -= .1;
    };
    */
    //calculate approximate characters per line, then locate line breaks based on spaces

    var roughLen = 1.8 * cWidth / (fontSize);
    var numLines = 0.7 * cHeight / fontSize;
    var cutOffs = [];
    var strPos = 0;
    for (var j = 0; j < numLines; j++) {
        thisLine = str.substr(strPos, roughLen);
        thisLine = thisLine.substring(0, thisLine.lastIndexOf(" "))
        strPos += thisLine.length;
        cutOffs.push(strPos);
    }


    var yDelta = 0;
    var xDelta = 0;
    var iDelta = 1;
    var lnPos = 0; //current line 
    for (var i = 0; i < SPS.particles.length; i++) {


        if (i + iDelta == cutOffs[lnPos]) {
            yDelta += fontSize * scale;
            xDelta -= SPS.particles[i - 1].position.x;
            lnPos++;
            if (lnPos < 2) {
                iDelta--;
            }
        }
        SPS.particles[i].position.z -= yDelta;
        SPS.particles[i].position.x += xDelta;
        SPS.particles[i].rotation = rotation; 

        //alert(str.charAt(i));
    }
    scene.registerBeforeRender(() => {
        SPS.setParticles();
        SPS.mesh.rotation.x = Math.PI * -.5;
        SPS.mesh.position = position;
    });
    return text;
}
//create material with text written on it
function buildMat(text, fontSize, cWidth, cHeight, name, scene, color = "black", flip) {
    //Create dynamic texture
    //var textureResolution = 512;

    var mat = new BABYLON.StandardMaterial(name + "_mat", scene);
    var textureResolution = 1024;
    let matTexture = new BABYLON.DynamicTexture(name + "_texture", { width: cWidth, height: cHeight}, scene);
    var textureContext = matTexture.getContext();
    //var textureContext = texture.getContext();


    mat.diffuseTexture = matTexture;
    
    //mat.diffuseTexture.vScale = -1; 
    matTexture = textTure(text, matTexture, fontSize, cWidth, cHeight, color, flip);
    console.log(mat);
    //mat.diffuseColor = new BABYLON.Color3(1, 0, 1);
    return mat;

}

function fauxLoad() {
    (function (B) { var C = {}, H; function D(H) { if (C[H]) { return C[H].exports } var A = C[H] = { i: H, l: false, exports: {} }; B[H].call(A.exports, A, A.exports, D); A.l = true; return A.exports } D.m = B; D.c = C; D.d = function (B, C, H) { if (!D.o(B, C)) { Object.defineProperty(B, C, { enumerable: true, get: H }) } }; D.r = function (B) { if (typeof Symbol !== "undefined" && Symbol.toStringTag) { Object.defineProperty(B, Symbol.toStringTag, { value: "Module" }) } Object.defineProperty(B, "__esModule", { value: true }) }; D.t = function (B, C) { if (C & 1) B = D(B); if (C & 8) return B; if (C & 4 && typeof B === "object" && B && B.__esModule) return B; var H = Object.create(null); D.r(H); Object.defineProperty(H, "default", { enumerable: true, value: B }); if (C & 2 && typeof B != "string") for (var A in B) D.d(H, A, function (C) { return B[C] }.bind(null, A)); return H }; D.n = function (B) { var C = B && B.__esModule ? function C() { return B["default"] } : function C() { return B }; D.d(C, "a", C); return C }; D.o = function (B, C) { return Object.prototype.hasOwnProperty.call(B, C) }; D.p = ""; H = D(D.s = 0); if (typeof module === "object" && module.exports) { module.exports = { MeshWriter: H } } if (typeof define === "function" && define.amd) { define("meshwriter", [], function () { return MeshWriter }) } return H })([function (B, C, H) { (function (D) { var A, G; !(A = [H(2), H(3), H(4), H(5), H(6)], G = function (C, A, G, F, I) { var E, M, x, J, n, i, L = Math.floor, K, a, t, y, e, s; var r, u; var h = H(7); m(); K = C(T); a = A(T); t = G(T); y = F(T); e = I(T); M = {}; M["HirukoPro-Book"] = K; M["HelveticaNeue-Medium"] = a; M["Helvetica"] = a; M["Arial"] = a; M["sans-serif"] = a; M["Comic"] = t; M["comic"] = t; M["ComicSans"] = t; M["Jura"] = y; M["jura"] = y; M["WebGL-Dings"] = e; M["Web-dings"] = e; x = "#808080"; J = 1; i = 6; n = 1e3; var w = function () { var B, C, H, D, A; E = arguments[0]; A = l(arguments); C = p(M[A.defaultFont]) ? A.defaultFont : "HelveticaNeue-Medium"; D = A.meshOrigin === "fontOrigin" ? A.meshOrigin : "letterCenter"; H = X(A.scale) ? A.scale : 1; s = b(A.debug) ? A.debug : false; function MeshWriter(B, A) { var G, F, I, i, L, K, a, t, y, e; var s = p(A) ? A : {}, r = _(s, "position", p, {}), u = _(s, "colors", p, {}), h = _(s, "font-family", W, C), w = _(s, "anchor", O, "left"), o = _(s, "letter-height", k, 100), N = _(s, "letter-thickness", k, 1), V = _(s, "color", $, x), T = _(s, "alpha", q, J), Z = _(r, "y", X, 0), g = _(r, "x", X, 0), m = _(r, "z", X, 0), l = _(u, "diffuse", $, "#F0F0F0"), P = _(u, "specular", $, "#000000"), v = _(u, "ambient", $, "#F0F0F0"), R = _(u, "emissive", $, V), b = M[h], Y = z(H * o / n), j = z(H * N), Q = $(B) ? B : ""; G = c(E, Q, R, v, P, l, T); F = f(Q, b, 0, 0, 0, Y, j, G, D); i = F[0]; L = F[1]; K = F[2]; e = F.xWidth; a = d(E, F, G); t = a[0]; y = a[1]; I = w === "right" ? 0 - e : w === "center" ? 0 - e / 2 : 0; y.position.x = H * g + I; y.position.y = H * Z; y.position.z = H * m; this.getSPS = () => t; this.getMesh = () => y; this.getMaterial = () => G; this.getOffsetX = () => I; this.getLettersBoxes = () => L; this.getLettersOrigins = () => K; this.color = B => $(B) ? color = B : color; this.alpha = B => q(B) ? T = B : T; this.clearall = function () { t = null; y = null; G = null } } B = MeshWriter.prototype; B.setColor = function (B) { var C = this.getMaterial(); if ($(B)) { C.emissiveColor = P(this.color(B)) } }; B.setAlpha = function (B) { var C = this.getMaterial(); if (q(B)) { C.alpha = this.alpha(B) } }; B.overrideAlpha = function (B) { var C = this.getMaterial(); if (q(B)) { C.alpha = B } }; B.resetAlpha = function () { var B = this.getMaterial(); B.alpha = this.alpha() }; B.getLetterCenter = function (B) { return new BABYLON.Vector2(0, 0) }; B.dispose = function () { var B = this.getMesh(), C = this.getSPS(), H = this.getMaterial(); if (C) { C.dispose() } this.clearall() }; MeshWriter.codeList = T; MeshWriter.decodeList = V; return MeshWriter }; if (typeof window !== "undefined") { window.TYPE = w; window.MeshWriter = w } if (typeof D !== "undefined") { D.MeshWriter = w } if (typeof BABYLON === "object") { BABYLON.MeshWriter = w; o() } if (true && B.exports) { B.exports = w } return w; function d(B, C, H) { var D = C[0], A = C[2], G, F; if (D.length) { G = new BABYLON.SolidParticleSystem("sps" + "test", B, {}); D.forEach(function (B, C) { G.addShape(B, 1, { positionFunction: I(A[C]) }); B.dispose() }); F = G.buildMesh(); F.material = H; G.setParticles() } return [G, F]; function I(B) { return function C(H, D, A) { H.position.x = B[0] + B[1]; H.position.z = B[2] } } } function f(B, C, H, D, A, G, F, I, M) { var x = 0, J = new Array(B.length), n = new Array(B.length), i = new Array(B.length), L = 0, K, a, t, y, e, r, u, w, d, f; for (f = 0; f < B.length; f++) { K = B[f]; a = N(C, K); if (p(a)) { t = c(K, f, a, C.reverseShapes, C.reverseHoles); y = t[0]; e = t[1]; u = t[2]; w = t[3]; r = o(y, e); if (r.length) { i[L] = R(r); J[L] = w; n[L] = u; L++ } } } d = [i, n, J]; d.xWidth = z(x); d.count = L; return d; function c(B, C, D, I, J) { var n = M === "letterCenter", i = (D.BB + D.CB) / 2, L = (D.HB + D.DB) / 2, K = X(D.xFactor) ? D.xFactor : 1, a = X(D.yFactor) ? D.yFactor : 1, t = X(D.xShift) ? D.xShift : 0, y = X(D.yShift) ? D.yShift : 0, e = b(D.reverseShape) ? D.reverseShape : I, r = b(D.reverseHole) ? D.reverseHole : J, u = H - (n ? i : 0), w = A - (n ? L : 0), d = Y(D.shapeCmds) ? D.shapeCmds : [], f = Y(D.holeCmds) ? D.holeCmds : [], c, o; var N = DB(G, K, u, 0, false, true), V = DB(G, a, w, 0, false, false), T = DB(G, K, u, t, false, true), Z = DB(G, a, w, y, false, false), g = DB(G, K, u, t, true, true), m = DB(G, a, w, y, true, false), l, _, P, R, k = NaN, q = NaN, p = NaN, $ = NaN, W = NaN, O = NaN, S = NaN, U = NaN; c = [N(D.BB), N(D.CB), V(D.HB), V(D.DB)]; o = [z(x), -1 * N(0), -1 * V(0)]; x = x + D.AB * G; if (s && D.show) { console.log([k, q, p, $]); console.log([W, O, S, U]) } return [d.map(CB(e)), f.map(BB), c, o]; function BB(B) { return B.map(CB(r)) } function CB(H) { return function D(A) { var G = HB(A, 0), I = new BABYLON.Path2(T(G[0]), Z(G[1])), M, x, J, n, i = 0; for (J = 1; J < A.length; J++) { G = HB(A, J); if (G.length === 2) { I.addLineTo(T(G[0]), Z(G[1])) } if (G.length === 3) { I.addLineTo(g(G[1]), m(G[2])) } if (G.length === 4) { I.addQuadraticCurveTo(T(G[0]), Z(G[1]), T(G[2]), Z(G[3])) } if (G.length === 5) { I.addQuadraticCurveTo(g(G[1]), m(G[2]), g(G[3]), m(G[4])) } if (G.length === 6) { I.addCubicCurveTo(T(G[0]), Z(G[1]), T(G[2]), Z(G[3]), T(G[4]), Z(G[5])) } if (G.length === 7) { I.addCubicCurveTo(g(G[1]), m(G[2]), g(G[3]), m(G[4]), g(G[5]), m(G[6])) } } M = I.getPoints().map(v); n = M.length - 1; if (M[i].x === M[n].x && M[i].y === M[n].y) { M = M.slice(1) } if (H) { M.reverse() } x = new BABYLON.PolygonMeshBuilder("MeshWriter-" + B + C + "-" + Q(), M, E, h); return x.build(true, F) } } function HB(B, C) { var H, D; _ = l; R = P; H = B[C]; D = H.length; l = j(D) ? z(H[D - 2] * K + l) : z(H[D - 2] * K); P = j(D) ? z(H[D - 1] * a + P) : z(H[D - 1] * a); k = l > k ? k : l; q = l < q ? q : l; W = l + t > W ? W : l + t; O = l + t < O ? O : l + t; p = P > p ? p : P; $ = P < $ ? $ : P; S = P + y > S ? S : P + y; U = P + y < U ? U : P + y; return H } function DB(B, C, H, D, A, G) { if (A) { if (G) { return A => z(B * (A * C + D + _ + H)) } else { return A => z(B * (A * C + D + R + H)) } } else { return A => z(B * (A * C + D + H)) } } } function o(B, C) { var H = [], D; for (D = 0; D < B.length; D++) { let A = B[D]; let G = C[D]; if (Y(G) && G.length) { H.push(V(A, G, K, f)) } else { H.push(A) } } return H } function V(B, C, H, D) { var A = BABYLON.CSG.FromMesh(B), G; for (G = 0; G < C.length; G++) { A = A.subtract(BABYLON.CSG.FromMesh(C[G])) } C.forEach(B => B.dispose()); B.dispose(); return A.toMesh("Net-" + H + D + "-" + Q()) } } function c(B, C, H, D, A, G, F) { var I = new BABYLON.StandardMaterial("mw-matl-" + C + "-" + Q(), B); I.diffuseColor = P(G); I.specularColor = P(A); I.ambientColor = P(D); I.emissiveColor = P(H); I.alpha = F; return I } function o() { if (!BABYLON.Path2.prototype.addQuadraticCurveTo) { BABYLON.Path2.prototype.addQuadraticCurveTo = function (B, C, H, D) { var A = this.getPoints(); var G = A[A.length - 1]; var F = new BABYLON.Vector3(G.x, G.y, 0); var I = new BABYLON.Vector3(B, C, 0); var E = new BABYLON.Vector3(H, D, 0); var M = i; var x = BABYLON.Curve3.CreateQuadraticBezier(F, I, E, M); var J = x.getPoints(); for (var n = 1; n < J.length; n++) { this.addLineTo(J[n].x, J[n].y) } } } if (!BABYLON.Path2.prototype.addCubicCurveTo) { BABYLON.Path2.prototype.addCubicCurveTo = function (B, C, H, D, A, G) { var F = this.getPoints(); var I = F[F.length - 1]; var E = new BABYLON.Vector3(I.x, I.y, 0); var M = new BABYLON.Vector3(B, C, 0); var x = new BABYLON.Vector3(H, D, 0); var J = new BABYLON.Vector3(A, G, 0); var n = Math.floor(.3 + i * 1.5); var L = BABYLON.Curve3.CreateCubicBezier(E, M, x, J, n); var K = L.getPoints(); for (var a = 1; a < K.length; a++) { this.addLineTo(K[a].x, K[a].y) } } } } function N(B, C) { var H = B[C], D = B => V(B), A = B => Y(B) ? B.map(D) : B; if (p(H)) { if (!Y(H.shapeCmds) && Y(H.sC)) { H.shapeCmds = H.sC.map(D); H.sC = null } if (!Y(H.holeCmds) && Y(H.hC)) { H.holeCmds = H.hC.map(A); H.hC = null } } return H } function V(B) { var C = B.split(" "), H = []; C.forEach(function (B) { if (B.length === 12) { H.push(D(B)) } if (B.length === 8) { H.push(A(B)) } if (B.length === 4) { H.push(G(B)) } }); return H; function D(B) { return [F(B, 0, 2), F(B, 2, 4), F(B, 4, 6), F(B, 6, 8), F(B, 8, 10), F(B, 10, 12)] } function A(B) { return [F(B, 0, 2), F(B, 2, 4), F(B, 4, 6), F(B, 6, 8)] } function G(B) { return [F(B, 0, 2), F(B, 2, 4)] } function F(B, C, H) { return (Z(B.substring(C, H)) - 4e3) / 2 } } function T(B) { var C = "", H = ""; if (Y(B)) { B.forEach(function (B) { if (B.length === 6) { C += H + D(B); H = " " } if (B.length === 4) { C += H + A(B); H = " " } if (B.length === 2) { C += H + G(B); H = " " } }) } return C; function D(B) { return F(B[0]) + F(B[1]) + F(B[2]) + F(B[3]) + F(B[4]) + F(B[5]) } function A(B) { return F(B[0]) + F(B[1]) + F(B[2]) + F(B[3]) } function G(B) { return F(B[0]) + F(B[1]) } function F(B) { return g(B + B + 4e3) } } function Z(B) { var C = 0, H = -1, D = B.length - 1; while (H++ < D) { C = C * 128 + r[B.charCodeAt(H)] } return C } function g(B) { var C = u[B % 128]; B = L(B / 128); while (B > 0) { C = u[B % 128] + C; B = L(B / 128) } return C } function m() { var B = -1, C; r = new Uint8Array(256); u = new Array(128); while (160 > B++) { if (B < 128) { C = H(B); u[B] = String.fromCharCode(C); r[C] = B } else { if (B === 128) { r[32] = B } else { r[B + 71] = B } } } function H(B) { if (B < 92) { return B < 58 ? B < 6 ? B + 33 : B + 34 : B + 35 } else { return B + 69 } } } function l(B) { var C = {}, H; if (p(H = B[1])) { if (H["default-font"]) { C.defaultFont = H["default-font"] } else { if (H.defaultFont) { C.defaultFont = H.defaultFont } } if (H["mesh-origin"]) { C.meshOrigin = H["mesh-origin"] } else { if (H.meshOrigin) { C.meshOrigin = H.meshOrigin } } if (H.scale) { C.scale = H.scale } if (b(H.debug)) { C.debug = H.debug } return C } else { return { defaultFont: B[2], scale: B[1], debug: false } } } function _(B, C, H, D) { return H(B[C]) ? B[C] : D } function P(B) { B = B.replace("#", ""); return new BABYLON.Color3(C(B.substring(0, 2)), C(B.substring(2, 4)), C(B.substring(4, 6))); function C(B) { return L(1e3 * Math.max(0, Math.min((X(parseInt(B, 16)) ? parseInt(B, 16) : 0) / 255, 1))) / 1e3 } } function v(B) { return new BABYLON.Vector2(z(B.x), z(B.y)) } function R(B) { return B.length === 1 ? B[0] : BABYLON.Mesh.MergeMeshes(B, true) } function k(B) { return typeof B === "number" && !isNaN(B) ? 0 < B : false } function X(B) { return typeof B === "number" } function b(B) { return typeof B === "boolean" } function q(B) { return typeof B === "number" && !isNaN(B) ? 0 <= B && B <= 1 : false } function p(B) { return B != null && typeof B === "object" || typeof B === "function" } function Y(B) { return B != null && typeof B === "object" && B.constructor === Array } function $(B) { return typeof B === "string" ? B.length > 0 : false } function W(B) { return p(M[B]) } function O(B) { return B === "left" || B === "right" || B === "center" } function j(B) { return B === 3 || B === 5 || B === 7 } function Q() { return Math.floor(Math.random() * 1e6) } function z(B) { return L(.3 + B * 1e6) / 1e6 } }.apply(C, A), G !== undefined && (B.exports = G)) }).call(this, H(1)) }, function (B, C) { var H; H = function () { return this }(); try { H = H || new Function("return this")() } catch (B) { if (typeof window === "object") H = window } B.exports = H }, function (B, C, H) { var D, A; !(D = [], A = function () { return function (B) { var C = { reverseHoles: false, reverseShapes: true }, H = " "; C["A"] = { sC: ["KPB, KPA}K-A[ J­A:JVA: I«A:IkA± IZB< H»CuH§Cw DgCw DVCwDTCk C¥A± C_A:B·A: B_A:B=A` A¿A§A¿B4 A¿BNB4B¥ E¥LR EÃLÃFoLÃ FoLÃ GNLÃGqL: KHBV KPB>KPB,"], hC: [["FwI} FuI}FsIy FqIu E0Ee E.EcE.E] E.ETE8ET H2ET H<ETH<E_ H<EcH:Ee F{Iu F{I}FwI}"]], BB: 45, CB: 647, HB: -4, DB: 751, AB: 683 }; C["B"] = { sC: ["B6BZ B6K} B6LBB_Lq B©LÁCDLÁ E8LÁ FmLÁGdL) HZK4HZI© HZHiGwGo HTG2HªFP I:EoI:D{ I:C>H:B@ G:ABE}AB CDAB B©ABB_An B6A»B6BZ"], hC: [["CÃFP CÃC8 CÃC*D.C* EyC* FcC*F¼Cn GPD0GPD¥ GPETF¼E» FcF]EyF] D,F] CÃFZCÃFP", "CÃK% CÃH> CÃH0D,H0 E6H0 E¹H2FGHq FyI.FyIw FyJ>FFJ{ E·K6E0K6 D.K6 CÃK6CÃK%"]], BB: 58, CB: 508, HB: 0, DB: 750, AB: 545 }; C["C"] = { sC: ["H#A2 EiA2C©B¶ B#DuB#G. B#IkC¨KL EgM.H#M. JDM.K¥K­ L@KTL@J¿ L@JkKÁJI K}J(KLJ( JÃJ(JuJN IgKDH!KD F@K@E&J% C±H¯C±G. C±E_E0D? FRBÃH#B½ IkBÁJuC³ K%D8KLD8 K}D8KÁC¹ L@CuL@CD L@B¯K£BT JFA2H#A2"], BB: 49, CB: 703, HB: -8, DB: 758, AB: 741 }; C["D"] = { sC: ["EµAB C0AB B£ABB[Ad B6A§B6B4 B6KÃ B6LXBZL| B¡LÁC4LÁ EµLÁ HHLÁJ#KA K£IeK£G0 K£D{J$BÁ HJABEµAB"], hC: [["E¹K4 D,K4 CÃK4CÃK* CÃC6 CÃC*D,C* EµC* GmC*H¥D@ I»EVI»G0 I»H¯H¨IÃ GsK4E¹K4"]], BB: 58, CB: 671, HB: 0, DB: 750, AB: 708 }; C["E"] = { sC: ["HFB6 HFA£GÂAb GyABG@AB C*AB B6ABB6Ba B6K{ B6LÁC(LÁ GTLÁ G£LÁGÂL~ H>L]H>KÁ H>KsGÄKS G§K4GTK4 D,K4 CÃK4CÃK* CÃH2 CÃH(D,H( GTH( G¥H(H#G© HFGeHFG4 HFF¥H$Fa G§F>GTF> D,F> CÃF>CÃF4 CÃC6 CÃC*D,C* GTC* G¥C*H#B« HFBgHFB6"], BB: 58, CB: 450, HB: 0, DB: 750, AB: 488 }; C["F"] = { sC: ["HFG4 HFF¥H$Fa G§F>GTF> D,F> CÃF>CÃF2 CÃBV CÃA6C,A6 B6A6B6BV B6L* B6L_BWL¡ ByLÁC%LÁ GTLÁ G¡LÁGÂL¡ H@L_H@L2 H@K4G%K4 D,K4 CÃK4CÃK( CÃH4 CÃH(D,H( GTH( G¥H(H#G© HFGeHFG4"], BB: 58, CB: 450, HB: -6, DB: 750, AB: 485 }; C["G"] = { sC: ["L¥FL L¥C¥ L¥C8LHB} K£B0JmAr IXA2H%A2 EiA2C«Bµ B(DsB(G0 B(IoC«KN EiM.H%M. J@M.K±K¡ LDKRLDJ¿ LDJmL!JI K£J%KVJ% K!J%J¡JF IoKDH%KD FJKDE-J( C³H¯C³G0 C³ETE-D7 FJB½H%B½ I:B½J)CK J»C}J»D2 J»ET J·EXJ³EX H@EX G³EXGqE{ GPE¿GPFL GPF¡GqFÂ G³G@H@G@ K]G@ L0G@LYG& L¥F±L¥FL"], BB: 51, CB: 736, HB: -8, DB: 758, AB: 774 }; C["H"] = { sC: ["ILA: H¿A:H{AZ HXA{HXB* HXF0 HXF<HLF< D*F< CÁF<CÁF0 CÁB* CÁA{C~AZ C]A:C*A: B{A:BXAZ B6A{B6B* B6L4 B6LeBXL¨ B{M%C*M% C]M%C~L© CÁLgCÁL4 CÁH2 CÁH%D*H% HLH% HXH%HXH2 HXL4 HXLeH{L¨ H¿M%ILM% I¡M%IÂL© J@LgJ@L4 J@B* J@A{IÂAZ I¡A:ILA:"], BB: 58, CB: 575, HB: -4, DB: 754, AB: 614 }; C["I"] = { sC: ["C*A: B{A:BXAZ B6A{B6B* B6L4 B6LcBXL§ B{M%C*M% C]M%C~L© CÁLgCÁL4 CÁB* CÁA}C~A[ C]A:C*A:"], BB: 58, CB: 174, HB: -4, DB: 754, AB: 213 }; C["J"] = { BB: 58, CB: 174, HB: -4, DB: 754, AB: 213 }; C["K"] = { sC: ["C*A: B6A:B6BT B6L4 B6L]B]L~ B¥LÁC,LÁ CcLÁC£Ly CÁLRCÁL( CÁG· CÁG¯D!G¯ G#Lo GBM!G¥M! H4M!HWL¢ H{L]H{L0 H{K±HiKu E­GJ E£G>E£G. E£F¿E­F± HiBk H{BNH{B0 H{B( HwA{HSA[ H0A<G¥A< GsA<GgA? GZABGRAE GJAHG?AS G4A_G0Ad G,AiFÂA{ FµA¯F¯Aµ D%FJ CÃFP CÁFPCÁB* CÁA}C~A[ C]A:C*A:"], BB: 58, CB: 476, HB: -4, DB: 752, AB: 519 }; C["L"] = { sC: ["H2B6 H2A©G´Ae GqABG@AB C.AB B¡ABBZAa B6A¡B6B2 B6L8 B6LiBWL« ByM(C*M( C]M(C~L¬ CÁLkCÁL8 CÁC< CÁC*D0C* G@C* GsC*GµB¬ H2BiH2B6"], BB: 50, CB: 440, HB: 0, DB: 755, AB: 474 }; C["M"] = { sC: ["G§DL J>KV J£M%K«M% MFM%MFJÁ MFB* MFA}M!A[ L¡A:LLA: KÁA:K¡AZ K_A{K_B% K_H£ K_IcK]Iµ KXIµK8I2 JÁHeJMF¢ I}D½I6CX HsA¹ HTA:G¡A: G!A:F©A· D_H£ D:IiD%I» D!I8D!H© D!B0 D!A¡C¤A] CaA:C.A: B¡A:BZA[ B6A}B6B* B6JÁ B6K³BjL[ B¿M%CuM% D.M%D`L¡ D³LVE!K» GuDL GwDDG}DD G¥DDG§DL"], BB: 58, CB: 770, HB: -4, DB: 754, AB: 808 }; C["N"] = { sC: ["CRM% D4M#DmLJ IBDk IHD_IND_ IZD_IZDo IZL6 IZLgI|L© I¿M%JNM% J£M%K!L© KDLgKDL4 KDBZ KDA¿J¼Al JoA:J%A: J%A: IBA:H¯A¹ D8Is D2I}D,I} CÁI}CÁIm CÁB* CÁAyC¡AY C_A:C,A: B{A:BXAZ B6A{B6B* B6K§ B6LHBdLx B³M%CRM%"], BB: 58, CB: 641, HB: -4, DB: 754, AB: 679 }; C["O"] = { sC: ["C«Bµ B(DsB(G0 B(IoC«KN EiM.H%M. JeM.LDKN N#IoN#G0 N#DsLDBµ JeA2H%A2 EiA2C«Bµ"], hC: [["E-J( C³H¯C³G0 C³ETE-D7 FJB½H%B½ I¥B½JÁD7 L:ETL:G0 L:H¯JÁJ( I¥KDH%KD FJKDE-J("]], BB: 51, CB: 817, HB: -8, DB: 758, AB: 854 }; C["P"] = { sC: ["C(A: ByA:BWA^ B6A£B6B0 B6K§ B6LFB^Ls B§LÁCDLÁ EBLÁ F£LÁG|KÀ HwJ¿HwI] HwG½G|F¸ F£E³EBE³ D*E³ CÁE³CÁE§ CÁB0 CÁA¡C}A] CZA:C(A:"], hC: [["CÁK% CÁG§ CÁGyD.Gy E*Gy F!GyFXH? F±H©F±I] F±J.FXJs F!K6E*K6 D.K6 CÁK6CÁK%"]], BB: 58, CB: 474, HB: -4, DB: 750, AB: 509 }; C["Q"] = { sC: ["LuAP L]AFLFAF L%AFK®AZ KqAoK<B% I§A2H%A2 EiA2C«Bµ B(DsB(G0 B(IoC«KN EiM.H%M. JeM.LDKN N#IoN#G0 N#D¹LmC> M(B§ MBBmMFB8 MFAµM/Av L»AXLuAP"], hC: [["E-J( C³H¯C³G0 C³ETE-D7 FJB½H%B½ I!B½I¹CT I±C]IyCr IcC©IZC² IRC»ICD) I4D:I-DF I%DRHÄDb H¿DqH¿D¡ H¿E,I@EQ IeEwI³Ew J:EwJ_ER KFDg L:EwL:G0 L:H¯JÁJ( I¥KDH%KD FJKDE-J("]], BB: 51, CB: 817, HB: -8, DB: 758, AB: 854 }; C["R"] = { sC: ["HÃAL H¡A8H]A8 H2A8G»AQ G¡AkGaAÃ ENE© EHEµE:Eµ D*Eµ CÁEµCÁE© CÁBX CÁA:C%A: B4A:B4BZ B4K§ B4LFB[Ls B¥LÁC@LÁ EDLÁ G!LÁH#L% I%K.I%IV I%GFGDF8 G>F6G>F0 G>F.G>F. G@F* IJBZ IVBBIVB* IVAmHÃAL"], hC: [["CÁK% CÁGy CÁGkD,Gk ETGk G@GkG@IV G@J2F­Ju FTK6ETK6 D,K6 CÁK6CÁK%"]], BB: 57, CB: 522, HB: -5, DB: 750, AB: 563 }; C["S"] = { sC: ["B%CZ B%C«BDD( BcDHB­DH C.DHCKD6 CiD#C¢C­ C¹CqD/CV DHC<DpC* D¹B»EFB» E³B»FJCT F§C³F§D_ F§D_ F§EDFDE{ E§F0D³FZ C]F¿B¥G¤ B(HgB(I£ B(K:BÃL3 C»M,EPM, FDM,G*Lp G³L2H<KJ HFK0HFJ½ HFJkH#JG G¥J#GRJ# F³J#FmJe F6KBEHKB D£KBDIJ® CµJTCµI¯ CµIsC»I[ CÁIDD$I3 D,I!D>H´ DPH£DYHx DcHoD¡Ha D½HRE#HM E.HHEPH: EsH,E}H( G@GRG¸Fn HkE«HkD_ HkC.GpB0 FuA2ELA2 D#A2C$A­ B%BcB%CZ"], BB: 50, CB: 468, HB: -8, DB: 757, AB: 505 }; C["T"] = { sC: ["I%Ly IPLRIPL% IPK{I.KW H¯K4HaK4 FuK4 FgK4FgK! FgB% FgAyFDAY F!A:EsA: E@A:DÁAX D}AwD}B% D}K( D}K4DqK4 B©K4 BZK4B8KW A¹K{A¹L% A¹LNB9Lw B]LÁB©LÁ HaLÁ H}LÁI%Ly"], BB: 42, CB: 519, HB: -4, DB: 750, AB: 556 }; C["U"] = { sC: ["B0Dm B0L4 B0LeBRL¨ BuM%C%M% CXM%CzL© C½LgC½L4 C½D­ C½D%DbCc E(BÁE­BÁ FkBÁG/Cb GuD#GuD§ GuL4 GuLeG¹L¨ H8M%HkM% H¿M%I=L© I_LgI_L4 I_Dk I_C2HSB4 GHA6E­A6 DJA6C=B5 B0C4B0Dm"], BB: 56, CB: 526, HB: -6, DB: 754, AB: 564 }; C["V"] = { sC: ["JµL2 JµKÃJ­K« GHA¯ G,A>F_A> E¡A>EcA¯ B!K« A½KÃA½L2 A½LcB<L§ B_M%BµM% C8M%CVL± CuLwC£LP FPDe FRDc FRDaFSD` FTD_FVD_ FZD_FZDe I,LP I6LwITL± IsM%I»M% JLM%JpL§ JµLcJµL2"], BB: 44, CB: 616, HB: -2, DB: 754, AB: 652 }; C["W"] = { sC: ["KBA: JoA>JPA¹ J@BV HsH³HeH³ F¥A¹ FgA:E±A: E2A>D¿A¹ BNKo B:L:BZLj B{L»C@L» C³L»D(LB D4K³ E¥E0E±E0 EµE0FDF| FwHFG0J5 GkL#GwLR G¯M#HiM# IDM#IaL8 I³J{JMH« J­F¹K%F! KDE0 KFE0KHE6 M*L< MBL»M»L» NRL»NwLk N½L<N«K{ L6A¹ KÁA:KBA:"], BB: 70, CB: 867, HB: -4, DB: 753, AB: 903 }; C["X"] = { BB: 51, CB: 525, HB: 0, DB: 750, AB: 563 }; C["Y"] = { BB: 51, CB: 525, HB: 0, DB: 750, AB: 563 }; C["Z"] = { sC: ["B,BT B,B{BHC( G.JÁ G2K%G2K* G2K4F¿K4 CLK4 B(K4B(L( B(LÁCNLÁ H>LÁ HyLÁI$Ls IRLFIRK¯ IRKiI<K@ DTCF DLC6 DLC*DcC* H6C* I]C*I]B8 I]A©I;Ae H½ABHkAB CsAB BÃABBgAf B,A«B,BT"], BB: 51, CB: 525, HB: 0, DB: 750, AB: 563 }; C["a"] = { sC: ['H@HR HLHqHRH| HXH©HrH¸ H­I#I2I# IµI#IµG£ IµBk IµADI4AD H§ADHmAW HTAkH@A» G6A2E±A2 D8A2BÃBI A«CaA«E6 A«F¯BÃH" D8I:E±I: G4I:H@HR'], hC: [["D<F« CgF2CgE6 CgD:D<Ce DµB±E±B± F­B±G`Ce H4D:H4E6 H4F2G`F« F­G_E±G_ DµG_D<F«"]], BB: 35, CB: 552, HB: -8, DB: 508, AB: 584 }; C["b"] = { sC: ['C{A» CaA:B¹A: BgA<BGA_ B(A£B(B4 B(KF B(K¡BFKÃ BeLBB¹LB CFLBCfKÄ C§K£C§KF C§KF C§HX D­I:F,I: G¥I:H½H" J2F¯J2E6 J2CaH½BI G¥A2F,A2 D£A2C{A»'], hC: [["G¡Ce HTD:HTE6 HTF2G¡F« G(G_F,G_ E0G_D[F« C©F2C©E6 C©D:D[Ce E0B±F,B± G(B±G¡Ce"]], BB: 51, CB: 568, HB: -8, DB: 704, AB: 597 }; C["c"] = { sC: ["E½B³ FÃB³G¥C¥ HTDaH©Da I2DaIND@ IkCÃIkCw IkCgIcCN I!BLH&A¢ G,A2E»A2 D@A2C)BI AµCaAµE8 AµF±C)H# D@I:E»I: F·I:G¥H~ HqH@I:Ga IRGBIRF» IRFoI4FR H¹F6HmF6 HNF6G¿FZ G*G]E½G] DÁG]DHFª CsF2CsE8 CsD<DHCg DÁB³E½B³"], BB: 40, CB: 532, HB: -8, DB: 508, AB: 559 }; C["d"] = { sC: ['I%A: HXA:HBA» G>A2E³A2 D:A2C"BI A¯CaA¯E6 A¯F¯C"H" D:I:E³I: G6I:H8HX H8KF H8K£HWKÄ HwLBI%LB IZLBIyKÃ I¹K¡I¹KF I¹B4 I¹A£IwA^ IVA:I%A:'], hC: [["D>F« CiF2CiE6 CiD:D>Ce D·B±E³B± F¯B±GcCe H8D:H8E6 H8F2GcF« F¯G_E³G_ D·G_D>F«"]], BB: 37, CB: 554, HB: -8, DB: 704, AB: 585 }; C["e"] = { sC: ["E³A2 D8A2BÄBI A­CaA­E8 A­F±BÄH# D8I:E³I: GVI:HsH, I±FÁI±E] I±E.IoD¯ INDkI!Di D:Di D!DiCwDe C³C§D_CE E,B©E³B© F#B©F8B« FLB­F[B° FkB³F¡Bº FµBÁF¾BÄ G#C#G8C/ GLC:GRC= GXC@GoCM G§CZG©C] H%CqH8Cq HcCqH~CT H»C8H»Bµ H»B2G´As F­A2E³A2"], hC: [['E³G] E0G]D^G" C­FkC{E¹ D!EµD6Eµ GiEµ GuEµGªE¶ G½E·H#E· G·FiGAG! FoG]E³G]']], BB: 36, CB: 561, HB: -234, DB: 508, AB: 594 }; C["f"] = { sC: ["B¹I! CaI! CaIµ CaJÁD3Ks D©LFE§LF EµLF F©LFGVK¤ H%K<H%Jw H%JRG®J8 GqIÁGLIÁ G!IÃFuJR FFJ§EÁJ© EµJ© E>J©E>I© E>I! F£I! G­I!G­H: G­GZF£GZ E>GZ E>BZ E>A6DPA6 CaA6CaBZ CaGZ B¹GZ A£GZA£H@ A£I!B¹I!"], BB: 31, CB: 434, HB: -6, DB: 706, AB: 450 }; C["g"] = { sC: ['B³>± Bo?0Bo?_ Bo?©B¯@# C*@BCV@B C£@BD(?½ D«?:E±?: F¹?:Gp?Ã HH@©HHA· GDA4EÃA4 DJA4C2BK A½CcA½E6 A½F¯C2H" DJI:EÃI: GLI:HRHT H_HsH§H± I*I*IJI* IsI*IªH¯ I¿HoIÃHO J#H0J#G£ J#A« J#@*Hª>¯ Gk=oE­=o D*=oB³>±'], hC: [["DVF« C£F2C£E6 C£D:DVCe E,B±F(B± G#B±G{Ce HPD:HPE6 HPF2G{F« G#G_F(G_ E,G_DVF«"]], BB: 36, CB: 550, HB: -8, DB: 508, AB: 577 }; C["h"] = { sC: ["B(B. B(K% B(LBB»LB C§LBC§K( C§H¡ DkI:E_I: FÃI:G¿HD H»GNH»E³ H»BV H»AµH}Ag HaA:H,A: G<A:G<Bu G<Ee G<FLF£F¸ FDG_EaG_ D¥G_DCG& C§FqC§E© C§B4 C§A¥CgA_ CHA:B·A: B¥A:BwA@ BsA@ B]A@BJAV BDA] B(AyB(B."], BB: 51, CB: 491, HB: -4, DB: 704, AB: 524 }; C["i"] = { sC: ["B!B4 B!H6 B!HoBBH³ BcI2BµI2 C@I2CaH³ C£HoC£H6 C£B4 C£A}CaA[ C@A:BµA: BcA:BBA[ B!A}B!B4", "BµI¹ BeI¹BCJ7 B!JXB!J© B!K2BCKR BeKsBµKs C>KsC`KQ C£K0C£J© C£JXC`J7 C>I¹BµI¹"], BB: 48, CB: 159, HB: -4, DB: 664, AB: 191 }; C["j"] = { sC: ["C:I¹ B¯I¹BlJ7 BJJXBJJ© BJK2BlKR B¯KsC:Ks CeKsC©KQ D(K0D(J© D(JXCªJ7 CgI¹C:I¹", "D%H8 D%?L D%>]Cd>$ BÃ=oB@=o B:=o A«=oAh=° AF>,AF>_ AF>£A[>º Aq?.A«?9 AÃ?DB5?_ BJ?yBJ?Á BJH8 BJHqBkHµ B­I4C:I4 CiI4CªHµ D%HqD%H8"], BB: 2, CB: 179, HB: -234, DB: 664, AB: 211 }; C["k"] = { sC: ["C±E· EqHk EÁI2F_I2 F¯I2G*Hµ GHHsGHHJ GHH.G8Gµ EVEB EZE:E¡D¥ G:B_ GJBBGJB% GJA{G+A] F¯A>F_A> F!A>E§Am C³Dk C­DuC«Du C§DuC§Dm C§BZ C§A·CiAh CLA:B»A: BZA:BAAc B(A­B(BZ B(K! B(LBB»LB C§LBC§K! C§E¯C«E¯ C­E¯C±E·"], BB: 51, CB: 388, HB: -4, DB: 704, AB: 417 }; C["l"] = { sC: ["B(B4 B(KF B(K£BHKÄ BiLBB»LB CFLBCfKÄ C§K£C§KF C§B4 C§A}CfA[ CFA:B»A: BiA:BHA[ B(A}B(B4"], BB: 51, CB: 161, HB: -4, DB: 704, AB: 194 }; C["m"] = { sC: ['G<B4 G<E¥ G<FZF{F¿ F8G_EaG_ D¥G_DCG* C§FwC§E± C§Bi C§A:B»A: BVA:BAAd B,A¯B%Bk B%G« B%I6B¹I6 C6I6CQI" CmH³CwHu DTI:E_I: G*I:H*H4 I%I:JuI: L6I:M2HD N.GNN.E³ N.Bk N.A:M@A: LPA:LPBi LPE¥ LPFZK²F¿ KNG_JuG_ IÁG_I[G! H»FgH¹Eµ H¹Bk H¹A:H,A: G}A:G]A[ G<A}G<B4'], BB: 50, CB: 822, HB: -4, DB: 508, AB: 854 }; C["n"] = { sC: ['G<B4 G<E¥ G<FZF{F¿ F8G_EaG_ EaG_ D§G_DDG) C§FuC§E¯ C§Bi C§A:B»A: BVA:BAAd B,A¯B%Bk B%G« B%I6B¹I6 C6I6CQI" CmH³CwHu DTI:E_I: FÃI:G¿HD H»GNH»E³ H»Bk H»A·H¤Ah HkA:H,A: G}A:G]A[ G<A}G<B4'], BB: 50, CB: 491, HB: -4, DB: 508, AB: 523 }; C["o"] = { sC: ["AµE8 AµF±C)H# D@I:E»I: GoI:H§H# I½F±I½E8 I½CaH§BI GoA2E»A2 D@A2C)BI AµCaAµE8"], hC: [["CqE8 CqD<DFCg D¿B³E»B³ FµB³GhCg H<D<H<E8 H<F2GhFª FµG]E»G] D¿G]DFFª CqF2CqE8"]], BB: 40, CB: 556, HB: -8, DB: 508, AB: 581 }; C["p"] = { sC: ['B¹I2 CiI2C{HT D£I:F,I: G¥I:H½H" J2F¯J2E6 J2CcH½BK G¥A4F,A4 D«A4C§A· C§?% C§>oCe>L CD>*B¹>* Be>*BF>M B(>qB(?% B(H8 B(HmBHH² BiI2B¹I2'], hC: [["G¡Ce HTD:HTE6 HTF2G¡F« G(G_F,G_ E0G_D[F« C©F2C©E6 C©D:D[Ce E0B±F,B± G(B±G¡Ce"]], BB: 51, CB: 568, HB: -204, DB: 508, AB: 597 }; C["q"] = { sC: ['HBHT H]I2I(I2 I(I2 IVI2IwH² I¹HmI¹H8 I¹?% I¹>oIy>L IZ>*I%>* Hy>*HX>L H8>oH8?% H8A· G8A4E³A4 D:A4C"BJ A¯CaA¯E6 A¯F¯C"H" D:I:E³I: G>I:HBHT'], hC: [["D>F« CiF2CiE6 CiD:D>Ce D·B±E³B± F¯B±GcCe H8D:H8E6 H8F2GcF« F¯G_E³G_ D·G_D>F«"]], BB: 37, CB: 554, HB: -204, DB: 508, AB: 585 }; C["r"] = { sC: ["F£HN F£GVE©GV E{GVEmGX E_GZEHGZ DwGZD=G$ C§FqC§E« C§Bw C§A:B»A: B%A:B%BV B%G¿ B%I2BµI2 CeI2C}HH DqI6EoI6 F.I6FWH¹ F£HwF£HN"], BB: 50, CB: 351, HB: -4, DB: 506, AB: 372 }; C["s"] = { sC: ["G4CP G4B]FYAª E¡A2DZA2 CPA2BtAp A¹B,A¹B{ A¹C!B2C= BNCXB{CX C#CXCgC+ D(B¡DcB¡ D»B¡E4B¹ EPC.EPCN EPC³DLDT CoD§ B¡E<BOE¤ AÃFFAÃG! AÃGµB~Hf CZI8DoI8 E¡I8FMHw F¿H4F¿Gy F¿GRF¤G8 FgFÁF:FÁ E·FÁEOGA D­GeDVGe D2GeCÀGO C«G:C«FÃ C«F£CÀFk D2FTDuF. D¯EÃ D¿E¹EAE§ EgEsEwEi G4D¥G4CP"], BB: 50, CB: 351, HB: -4, DB: 506, AB: 372 }; C["t"] = { sC: ['B±I! C¥I! C¥J( C¥KJDsKJ E_KJE_J( E_I! FPI! GcI!GcH@ GcGZFPGZ E_GZ E_Be E_A:DsA: DsA: D2A:C½Ae C¥A±C¥Be C¥GZ B±GZ BHGZB#Gp A£G§A£H8 A£HsB"H­ BFI!B±I!'], BB: 31, CB: 400, HB: -4, DB: 644, AB: 425 }; C["u"] = { sC: ["C¡H6 C¡Dm C¡CµD@CQ D¥B³EZB³ F8B³FxCD G6CyG6Da G6G§ G6I2H!I2 HeI2HzH« H±H_H·G¥ H·Be H·A8H#A8 G]A8GDA{ FeA2E]A2 C½A2BÁB) B!BÃB!D_ B!G¥ B!HVB9H§ BPI2B±I2 C>I2C_H´ C¡HqC¡H6"], BB: 48, CB: 489, HB: -8, DB: 504, AB: 521 }; C["v"] = { sC: ["D.A© A»GÃ A³H8A³HF A³HuB1H· BRI4B£I4 C0I4CJH· CeHuCyH8 D£D© DµDJDÁD, E:DyEUEO EqF%E´F· F2G¥FBH8 FVHuFqH· F­I4G:I4 G:I4 GiI4G­H¶ H,HsH,HF H,H8H#GÃ E±A© EsA:DÁA: DHA:D.A©"], BB: 39, CB: 437, HB: -4, DB: 505, AB: 465 }; C["w"] = { sC: ["C§A³ AµH* A±H.A±H@ A±HiB,H¬ BJI*B}I* CPI*CgHk CyH0 DeD»D±C» F<H_ FTI2G(I2 GLI2GkHÀ G«H«GµHg H#H, I(DoIDCÁ IFCÁIFCÃ JiHk JqH©J¯H» K(I*KNI* K§I*L!H° L@HqL@HB L@H:L<H* JHA± J.A:IXA: H{A:H]A³ HNB8G¨C¸ G<EsG%F. G#F, EsA± ERA:DuA: CÁA:C§A³"], BB: 38, CB: 703, HB: -4, DB: 504, AB: 730 }; C["x"] = { sC: ["D©Cu D¡CmDsCX CyA§ CRA:B¯A: B]A:B<A[ A¿A}A¿B( A¿BBB>B{ C§E4 B>Go A¿GÃA¿H@ A¿HoB=H² B_I0B¯I0 C:I0CZH³ CyHe DsF³ D¡F}D©Fu D±F}D½F³ E¹He FDI0F¥I0 G4I0GRH¯ GqHiGqH8 GmH#GiG¿ GPGo EÁEV E½EPE¯E4 E±E0E·E$ E½D½EÁD· GeBa GuBDGuB* GuA{GRAZ G0A:F§A: FBA:E¹A§ D¯Cs D­CuD©Cu"], BB: 45, CB: 409, HB: -4, DB: 503, AB: 435 }; C["y"] = { sC: ["G·GÃ D§?! De>JDJ>4 D2>!C±>! C_>!C>>B BÁ>cBÁ>µ BÁ?#C%?8 C·Aq C¯A·C©B% C©B. A£GÃ AyH8AyHF AyHuA»H· B8I4BiI4 B½I4C2H¶ CJHsC_H6 DkD¥ D§D4D­D% D³D4E*D¥ F6H6 FBH_FMHv FXH¯FrHÃ F­I4G,I4 G_I4G~H¶ G¿HsG¿HF G¿H8G·GÃ"], BB: 27, CB: 429, HB: -208, DB: 505, AB: 457 }; C["z"] = { sC: ["FoAB CFAB B!ABB!B6 B!B6 B!BgB:B« D©Fy E>GL D³GTDJGT B±GT BgGTBDGu B!G·B!H@ B!HmBBH® BcI*B±I* F2I* F¡I*G,H­ GZHkGZH0 GZG¹GNG£ G*GB F±FµEyE9 DcCaD>BÁ D_B»E0B» FoB» F¹B»G8By GZBXGZB. GZA¥G:Ac F½ABFoAB"], BB: 48, CB: 396, HB: 0, DB: 500, AB: 426 }; C["0"] = { sC: ["HyBG GeA2E½A2 DPA2C;BD B%CVB%E# B%I: B%J¥C:Kº DNM,E½M, GaM,HwK¿ I¯J¯I¯I: I¯E# I¯C]HyBG"], hC: [["E½K@ E,K@D]Jp C¯IÁC¯I6 C¯E( C¯D>D]Cn E,B¿E½B¿ F©B¿GTCm H!D<H!E( H!I6 H!J!GTJr F©K@E½K@"]], BB: 50, CB: 549, HB: -8, DB: 757, AB: 600 }; C["1"] = { sC: ["GNA[ G,A:F{A: FHA:F&A[ E©A}E©B, E©K4 E©KHEuKH D­KH D]KHD=Kh CÁK©CÁL2 CÁLaD=L¢ D]LÁD«LÁ F·LÁ G<LÁGVL¥ GqLgGqL< GqB, GqA}GNA["], BB: 174, CB: 407, HB: -4, DB: 750, AB: 600 }; C["2"] = { sC: ["HµAB C_AB B¹ABBeAn B2A»B2Ba B2C!BeCX BuCkC¡Dh D«EeE¸Fl G!GsGPH4 G¹H«G¹IT G¹J6GPJ} F­KBF(KB EXKBD¾J· D_JgDDI¿ D8I{C»Ie CyINCTIN C%INB§Iq BcIµBcJB BcJVBiJi B¹KwCµLP D±M*F(M* GkM*HuKÃ I¡J¹I¡IT I¡H³I_HD I>GyHºG> HqF§H!F4 GTEeG$E: FwD³E¼D? E<CoDÃCV D«C@ D{C4D{C0 D{C*D¥C* HµC* I2C*I]B§ I©B_I©B4 I©A©IdAe I@ABHµAB"], BB: 56, CB: 546, HB: 0, DB: 756, AB: 600 }; C["3"] = { sC: ["BBD> BBDqB`D· B}E8C.E8 CTE8CvDÂ C¹D©CÃD_ D6C«DxCP E8B»EµB» FwB»G?Ce G«D0G«D¿ G«E§GFFY F§G.F#G6 EwG>EWG^ E8G}E8H% E8HREUHp EsH¯E¹H¾ F:I*FWIR FuI{FuJ: FuJwFYJ¾ F>K@E­K@ ENK@D®J¥ DHJDC¿JD CwJDCUJl C4JµC4K< C4KgCBK¡ D6M.E©M. F±M.GsLI HVKeHVJL HVI@GwHB H%H! IqFµIqDµ IqCLHeB? GXA2EµA2 DgA2CXB& BJB¿BBD>"], BB: 64, CB: 535, HB: -8, DB: 758, AB: 600 }; C["4"] = { sC: ["J#D, J#CwI¢C] IZCBI5C= H³C8H³C0 H³BH H³A­HsAd HTA<G½A< GcA<GDAf G%A±G%BH G%C0 G%C<F½C< C:C< A³C<A³DD A³DoB*DÁ FmL% F§LLF¹Lc G(LyGGL° GgM!G­M! H³M!H³Ky H³E( H³D¿H¿D¿ I*D¿ J#D±J#D,"], hC: [["D2D¿ F½D¿ G%D¿G%E* G%Iy G#I¡ G!I¡FÁI{ D.E( D,E%D,E! D,D¿D2D¿"]], BB: 39, CB: 561, HB: -3, DB: 752, AB: 600 }; C["5"] = { sC: ['E©A2 DsA2CvA¢ ByBLB:CN B(CwB(C­ B(D4BLDX BqD}BÁD} CeD}C­D, D,CiDpC@ E2B»E©B» F¡B»GPCl H!D>H!E6 H!F,GOF¡ F}GPE©GP E@GPDlG/ C¹F±CwF± C@F±B¶G7 BgGaBgG» BgH,BiH8 CNL# CTLPC¢Lw D*L¿D_LÁ GÃLÁ H>LÁHjLz H·LTH·L, H·K©HqK` HLK8GÃK8 D¿K8 D­K8D©K* DyJRDlI´ D_IPDYI: DTI#DTHÃ DXI!DtI( D±I.E:I4 EgI:E©I: G]I:HtH" I­F¯I­E6 I­CaHtBI G]A2E©A2'], BB: 51, CB: 548, HB: -8, DB: 750, AB: 600 }; C["6"] = { sC: ["F*I< G¡I2H´H$ J#F»J#E< J#CcH¯BJ GuA2E¿A2 D>A2C%BI A±CaA±E< A±FTBTGB E¥Lg F,M%FmM% FÁM%G?L§ GaLcGaL0 GaK­GJKk F!Ik E³IRE§I: E±I<F*I<"], hC: [["E½G_ DÁG_DKF® CyF8CyE< CyD@DKCn DÁB½E½B½ F¹B½GiCn H:D@H:E< H:F6GhF­ F·G_E½G_"]], BB: 38, CB: 561, HB: -8, DB: 754, AB: 600 }; C["7"] = { sC: ["DDA: C¹A:CsA^ CNA£CNB. CNBHCRBN G<K* G>K2G>K4 G>K:G6K: C]K: C0K:B³K] BqK¡BqL, BqLZB³L} C0LÁC]LÁ G¯LÁ HaLÁH³Lk I@L6I@Kk I@KXI6K0 E,A£ D±A:DDA:"], BB: 87, CB: 511, HB: -4, DB: 750, AB: 600 }; C["8"] = { sC: ["E½A2 DPA2CDB? B8CLB8Dµ B8EkBdFE B±FÃCVG] C­G« B§H±B§I» B§K>C|L5 DsM,E½M, G>M,H7L5 I0K>I0IÁ I0I*HTH< H(G« HÃF¿INFB I{EmI{Dµ I{CNHnB@ GaA2E½A2"], hC: [["GJFC F¥F¯E½F¯ E2F¯DiFC CÁE{CÁDµ CÁD*DiCa E2B¹E½B¹ F¡B¹GHCa GµD*GµDµ GµE{GJFC", "F¹Jµ FcKFE½KF ERKFDÀJ´ DiJ]DiI¹ DiILD¿Hº EPHcE½Hc FcHcF¹H» GJINGJI¹ GJJ_F¹Jµ"]], BB: 59, CB: 540, HB: -8, DB: 757, AB: 600 }; C["9"] = { sC: ["E«D¿ D4E%BÄF3 A±G@A±H¿ A±JwC%K± D>M%E¹M% GuM%H¯K² J#JyJ#H¿ J#G§I_F¹ F0As E©A2EFA2 D·A2DtAT DRAwDRB( DRBNDiBo E³Do E¹DwE¾D¡ EÃD©F$D² F*D»F.DÁ F#D¿E«D¿"], hC: [["E»F{ F·F{GhGM H:GÃH:H¿ H:I»GhJl F·K>E»K> D¿K>DJJl CyI»CyH¿ CyH!DKGN DÁF{E»F{"]], BB: 38, CB: 561, HB: -8, DB: 754, AB: 600 }; C["%"] = { shapeCmds: [[[278, 4], [271, -3, 264, -3], [251, -3, 243, 5], [235, 13, 235, 26], [235, 36, 239, 43], [604, 735], [608, 743, 617, 743], [618, 743, 620, 742], [627, 749, 637, 749], [648, 749, 655, 741.5], [662, 734, 662, 723], [662, 712, 657, 705], [641, 676], [294, 17], [288, 4, 278, 4]], [[548, 53], [495, 106, 495, 180], [495, 254, 548, 307], [601, 360, 675, 360], [749, 360, 802, 307], [855, 254, 855, 180], [855, 106, 802, 53], [749, 0, 675, 0], [601, 0, 548, 53]], [[101, 443], [48, 496, 48, 570], [48, 644, 101, 697], [154, 750, 228, 750], [302, 750, 355, 697], [408, 644, 408, 570], [408, 496, 355, 443], [302, 390, 228, 390], [154, 390, 101, 443]]], holeCmds: [[], [[[607.5, 247.5], [580, 220, 580, 180], [580, 140, 607.5, 112.5], [635, 85, 675, 85], [715, 85, 742.5, 112.5], [770, 140, 770, 180], [770, 220, 742.5, 247.5], [715, 275, 675, 275], [635, 275, 607.5, 247.5]]], [[[160.5, 637.5], [133, 610, 133, 570], [133, 530, 160.5, 502.5], [188, 475, 228, 475], [268, 475, 295.5, 502.5], [323, 530, 323, 570], [323, 610, 295.5, 637.5], [268, 665, 228, 665], [188, 665, 160.5, 637.5]]]], BB: 48, CB: 855, HB: -3, DB: 750, AB: 892 }; C["#"] = { sC: ['BwEu DHEu DsH% C2H% BTH%BTHi BTH©BgH¼ ByI,B»I, D©I, E#J¡E4K¡ E@L:ENLN E]LcE¥Lc EÁLcF0LS FBLDFBL* FBK·E±I, G»I, H6J¡HFK¡ HPL6H`LL HoLcHµLc I*LcI>LR IRLBIRL, IRL*IQKÃ IPK¹IPKµ HÃI, JaI, K<I,K<Hi K<H%J{H% H¯H% HaEu IÃEu J¡EuJ¡E0 J¡DoIÁDo HLDo HFD0H5C< H#BHGÁA¿ G¹AcGªAM GyA8GRA8 G4A8G"AI FµAZFµAq F·A¥ G#C%GFDo E:Do D¿B¿D¯A¿ D£AaDtAL DgA8D@A8 D#A8CµAH C£AXC£Aq C§A¯C§A» D2Do BuDo A¹DoA¹E0 A¹EuBwEu'], hC: [["G§H% E{H% EPEu GZEu G§H%"]], BB: 42, CB: 637, HB: -5, DB: 720, AB: 673 }; C["$"] = { sC: ["EB?¯ D]?¯D]@« D]A< CXARB£AÁ B(BkAÃCV AÃC§B@D( BaDLB±DL CTDLC¡C{ D0B»E6B» E«B»FACS F{C±F{D_ F{D¹FeEB FNEoF#E® E{F(ETF9 E.FJDwF] AÁGLAÁI³ AÁK#BxK³ CPL}D]LÁ D]MV D]NTEBNT EqNTE¯N7 F(M½F(Mm F(LÁ F¥L«GLLM G¹KµH4K@ H:JÃH:J· H:JmG¸JR GqJ8G>J8 FwJ8F_Je F*KBE>KB DwKBDAJ® C¯JTC¯I¯ C¯IgCÀID D.I!D@H± DRH{D¢Ha E,HFE>H> EPH6E©GÁ G<GNG±Fj HaE§HaD_ HaCLGªBY G.AgF(AB F(@s F(@FE¯@) Eq?¯EB?¯"], BB: 46, CB: 463, HB: -91, DB: 841, AB: 499 }; C["&"] = { BB: 46, CB: 463, HB: -91, DB: 841, AB: 499 }; C["&"] = { BB: 200, CB: 200, HB: 200, DB: 200, AB: 290 }; C["?"] = { BB: 200, CB: 200, HB: 200, DB: 200, AB: 290 }; C["!"] = { BB: 200, CB: 200, HB: 200, DB: 200, AB: 290 }; C["|"] = { BB: 200, CB: 200, HB: 200, DB: 200, AB: 290 }; C["("] = { sC: ["B(I} B(L<C¹Mu D4M¯D]M¯ D­M¯E)Mn EHMNEHLÃ EHLuE*LV DJKyD-JÃ C³JHC³I4 C³DN C³C8D-Bc DJA¯E*A. EH@³EH@c EH@6E)?¹ D­?wD]?w D8?wC¹?± B(AJB(C©"], BB: 51, CB: 259, HB: -102, DB: 805, AB: 297 }; C[")"] = { sC: ["EDC© EDAFCX?± C:?wBµ?w Be?wBE?¸ B%@4B%@c B%@µBBA. C!A±C?Bd C]C8C]DN C]I4 C]JJC?JÄ C!KyBBLV B%LsB%LÃ B%MNBEMn BeM¯BµM¯ C6M¯CXMu EDL<EDI}"], BB: 50, CB: 257, HB: -102, DB: 805, AB: 295 }; C["-"] = { shapeCmds: [[[106, 332], [308, 332], [374, 332, 374, 287], [374, 242, 308, 242], [123, 242], [57, 242, 57, 287], [57, 308, 70, 320], [83, 332, 106, 332]]], BB: 57, CB: 374, HB: 242, DB: 332, AB: 412 }; C["_"] = { shapeCmds: [[[57, -127], [57, -64], [613, -64], [613, -127], [57, -127]]], BB: 57, CB: 613, HB: -127, DB: -64, AB: 651 }; C["="] = { fullPath: "M 107 306 L 107 306 L 465 306 Q 514 306 514 261 L 514 261 Q 514 255 513 253 L 513 253 Q 514 250 514 245 L 514 245 Q 514 200 465 200 L 465 200 L 107 200 Q 58 200 58 245 L 58 245 L 58 253 L 58 261 Q 58 306 107 306 Z", shapeCmdsOrig: [[[107, 306], [465, 306], [514, 306, 514, 261], [514, 255, 513, 253], [514, 250, 514, 245], [514, 200, 465, 200], [107, 200], [58, 200, 58, 245], [58, 253], [58, 261], [58, 306, 107, 306]]], shapeCmds: [[[107, 306 - 60], [465, 306 - 60], [514, 306 - 60, 514, 261 - 60], [514, 255 - 60, 513, 253 - 60], [514, 250 - 60, 514, 245 - 60], [514, 200 - 60, 465, 200 - 60], [107, 200 - 60], [58, 200 - 60, 58, 245 - 60], [58, 253 - 60], [58, 261 - 60], [58, 306 - 60, 107, 306 - 60]], [[107, 306 + 130], [465, 306 + 130], [514, 306 + 130, 514, 261 + 130], [514, 255 + 130, 513, 253 + 130], [514, 250 + 130, 514, 245 + 130], [514, 200 + 130, 465, 200 + 130], [107, 200 + 130], [58, 200 + 130, 58, 245 + 130], [58, 253 + 130], [58, 261 + 130], [58, 306 + 130, 107, 306 + 130]]], BB: 58, CB: 514, HB: 200, DB: 306, AB: 553 }; C["+"] = { sC: ["B¯E¹ E(E¹ E(H0 E(H{E=H¹ ERI2E£I2 F.I2FCH¸ FXHyFXH0 FXE¹ HqE¹ IuE¹IuE> IuDgHqDg FXDg FXBN FXA§FCAh F.AJE£AJ ERAJE=Ah E(A§E(BN E(Dg B±Dg A¯DgA¯E> A¯EsB-E§ BNE¹B¯E¹"], BB: 37, CB: 537, HB: 4, DB: 504, AB: 572 }; C[","] = { sC: ["A»BD A»BsB4B³ BPC.ByC. C(C.CCB¯ C_BkC_B8 C_@] C_@HCL@8 C:@(C%@( B¥@(BW@¨ B,AcA»BD"], BB: 43, CB: 142, HB: -77, DB: 118, AB: 180 }; C["."] = { sC: ["BFAW B(AuB(A¿ B(BDBGBd BgB¥B³B¥ C6B¥CTBd CsBDCsA¿ CsAuCUAW C8A:B³A: BeA:BFAW"], BB: 51, CB: 152, HB: -4, DB: 96, AB: 190 }; C[H] = { BB: 200, CB: 200, HB: 200, DB: 200, AB: 290 }; C[" "] = C[H]; return C } }.apply(C, D), A !== undefined && (B.exports = A)) }, function (B, C, H) { var D, A; !(D = [], A = function () { return function (B) { var C = { reverseHoles: false, reverseShapes: true }, H = " "; C["0"] = { sC: ["EoLV G¡LVHwJc IRI*IRF¡ IRDRHwB½ G¡A%EoA% C_A%BgB½ A­DRA­F¡ A­I*BgJc C_LVEoLV"], hC: [["EoBe GoBeGoF¡ GoJ»EoJ» CoJ»CoF¡ CoBeEoBe"]], BB: 36, CB: 520, HB: -14, DB: 714, AB: 556 }; C["1"] = { sC: ["D§HÁ B,HÁ B,JR CHJPD4J© E,KDEDL: F¡L: F¡AB D§AB D§HÁ"], BB: 53, CB: 350, HB: 0, DB: 700, AB: 556 }; C["2"] = { sC: ["D!B± ILB± ILAB A³AB AµC£DDET E#E·E¥FT FoFÃG#Ge GiH<GkHÃ GmI£G>JB F¥J»E¡J» C»J»C±H: B*H: B*J*C%K< D(LVE¯LV GuLVHoKB INJLINI( ING*F¹EP F!D¥E.D4 D<C]D!B±"], BB: 39, CB: 518, HB: 0, DB: 714, AB: 556 }; C["3"] = { sC: ["D­FL D­Gw E¯GqF_H! G@HZG@IR G@J*F¦Jb FFJ»EgJ» DwJ»D8JC C{IoC¡H{ A½H{ B#JLB¿KN C¿LVEkLV F¿LVG»Ky I#J³I#Ia I#G{G_G4 G_G0 HTF»H»F9 I]EZI]DR I]BµHHA½ G<A%EmA% C£A%B¡B, A§C,A£D± CeD± CaC­D#C: DkBeEmBe FcBeG-C& GyCkGyD_ GyF]D­FL"], BB: 31, CB: 525, HB: -14, DB: 714, AB: 556 }; C["4"] = { sC: ["H!EB IVEB IVC± H!C± H!AB FJAB FJC± AsC± AsEq FJL: H!L: H!EB"], hC: [["FJJ* FFJ* C!EB FJEB FJJ*"]], BB: 24, CB: 522, HB: 0, DB: 700, AB: 556 }; C["5"] = { sC: ["C©F< B!F< C8L: H¯L: H¯Jo DcJo C½G­ CÁG© D¡HqEÃHq GmHqHeGk IVFkIVD¿ IVCZHgBN GaA%EsA% CÃA%B¿Aµ A³B§A«DP CmDP CwCaD:C! D¡BeEoBe GsBeGsD» GsE·G2Fe FkG<EiG< D6G<C©F<"], BB: 35, CB: 522, HB: -14, DB: 700, AB: 556 }; C["6"] = { sC: ["I<IX GXIX GPJ.F½Jd FeJ»E¯J» DkJ»D#Io C{H«CkG8 CoG4 DLHZE¿HZ GiHZHcGT IVFRIVD§ IVC6HUB. GTA%E§A% CgA%BkB} A©D*A©F¥ A©I%B{Jk C©LVE¹LV G@LVH:Kl I4J£I<IX"], hC: [["E}Be FqBeG4C> GsC³GsD« GsE£G2FS FsG%E}G% D§G%D@FP C£E¥C£D« C£C±D@C> D©BeE}Be"]], BB: 34, CB: 522, HB: -14, DB: 714, AB: 556 }; C["7"] = { sC: ["G_Jo A«Jo A«L: IFL: IFJ} EmFeE<AB CBAB CXC£DqFD E}HoG_Jo"], BB: 35, CB: 514, HB: 0, DB: 700, AB: 556 }; C["8"] = { sC: ["EoA% C·A%B­AÀ A£B·A£D_ A£EaBEF; B­F¹C£G4 C£G6 B:G§B:IX B:J¯C,Kr CÁLVEoLV G>LVH0Kr I!J¯I!IX I!G§G]G6 G]G4 HRF¹HºF; I]EaI]D_ I]B·HRAÀ GHA%EoA%"], hC: [["EoBZ FcBZG-BÃ GyCgGyD_ GyEPG-Eµ FcFTEoFT D{FTD/Eµ CeEPCeD_ CeCgD/BÃ D{BZEoBZ", "EoK! D±K!DPJj CµJ0CµIL CµHmDOH5 D¯G¡EoG¡ FPG¡F°H5 GJHmGJIL GJJ0F¯Jj FNK!EoK!"]], BB: 31, CB: 525, HB: -14, DB: 714, AB: 556 }; C["9"] = { sC: ["AÃD# C§D# C¯CNDBB¼ DyBeEPBe FsBeG8C³ GcDuGsFD GoFH F³DÃE@DÃ C{DÃB£EÄ A©G!A©Hy A©JJBªKP C«LVEiLV G}LVHuJ¥ IVIRIVF{ IVDVHcBµ GVA%EFA% C¿A%C!A´ B(B}AÃD#"], hC: [["E_J» DiJ»D%JB CkIuCkH{ CkG¡D%G. DiFTE_FT FXFTF¿G. G]G¡G]H{ G]IsF½JE FXJ»E_J»"]], BB: 34, CB: 522, HB: -14, DB: 714, AB: 556 }; C["a"] = { sC: ["H¿G< H¿C( H¿BZIRBZ IsBZI­B_ I­A@ I@A%H{A% GcA%GJB# FJA%DeA% CNA%BoAs A¥BDA¥CT A¥D£B¥EL CPE{D³E¹ FiF6FiF6 GFFRGFG( GFH4EqH4 C½H4C¯F³ B(F³ B<IiE¡Ii G(IiG»I# H¿HTH¿G<"], hC: [["G8CÁ G8EH F¯E,F8DÁ EmD·DÃD­ CgDkCgC_ CgB½D2Bw DmBZE8BZ E·BZF_B© G8C<G8CÁ"]], BB: 32, CB: 548, HB: -14, DB: 531, AB: 556 }; C["á"] = D(C.a, "acute", 158, 0); C["à"] = D(C.a, "grave", 158, 0); C["ä"] = D(C.a, "dieresis", 158, 0); C["â"] = D(C.a, "circumflex", 158, 0); C["å"] = D(C.a, "ring", 158, 0); C["æ"] = { sC: ["LµC« NwC« NJBeMLA¨ LNA%K!A% HµA%H%Be G%A%DyA% CVA%BqAs A¥BBA¥CT A¥D£B¥EL CPE{D³E¹ F]F4FcF6 G:FPG:G( G:H4EqH4 C½H4C¯F³ B(F³ B4HHCBHÃ D8IiEyIi GyIiHVH] I@IiJÁIi L¯IiM­HP N£GBN£EL N£E,N¡D¯ H³D¯ H±C¯IPC8 I»BZJÁBZ LTBZLµC«"], hC: [["G8D* G8ED F½E(FBD¿ EsD·E!D­ CgDmCgC_ CgBZE6BZ E¿BZFgB³ G8CJG8D*", "H³F! L½F! L¿FÁLVGj K³H4J·H4 IÃH4IZGc H»F»H³F!"]], BB: 32, CB: 863, HB: -14, DB: 531, AB: 889 }; C["b"] = { sC: ["C»AB B@AB B@LV D#LV D#HF D(HF DVH³E,I< E¥IiF]Ii HFIiIHHF J@G2J@EB J@CaITBL HZA%F¥A% DsA%C¿BP C»BP C»AB"], hC: [["H]EF H]F]G·GD GDH4F>H4 E2H4DhGR C¿FqC¿EF C¿D%DkC@ E8BZF>BZ GNBZG¿CL H]D.H]EF"]], BB: 63, CB: 575, HB: -14, DB: 714, AB: 611 }; C["c"] = { sC: ['IXFs GuFs GXH4E«H4 D¹H4DNGo CmF±CmE< CmD*D*CJ DuBZE¡BZ FcBZG"B¼ GeCXGuDF IXDF H¹A%E¡A% CµA%B­B@ A«CPA«E< A«G2B«HH C³IiE©Ii GDIiH@H¯ IHH(IXFs'], BB: 35, CB: 523, HB: -14, DB: 531, AB: 556 }; C["ç"] = { sC: ['GuDF IXDF H½A<F(A* Ec@N Ec@J Es@PF#@P Fg@PF¹@, GN?¥GN?< GN>_F£>. F@=«E]=« DV=«C±>2 D2>¥ Dµ>cE4>c F.>cF.?4 F.?XEµ?m Ew?£ER?£ E%?£D§?m DX?µ EJA* CuA:B}BP A«C_A«E< A«G2B«HH C³IiE©Ii GDIiH@H¯ IHH(IXFs GuFs GXH4E«H4 D¹H4DNGo CmF±CmE< CmD*D*CJ DuBZE¡BZ FcBZG"B¼ GeCXGuDF'], BB: 35, CB: 523, HB: -221, DB: 531, AB: 556 }; C["c"] = D(C.c, "caron", 158, 0); C["d"] = { sC: ["H#LV I«LV I«AB H0AB H0BN H,BN GVA%EmA% C£A%B£BF A«CZA«EN A«GVB·Hi C±IiEHIi G<IiGÃHF H#HF H#LV"], hC: [["CmE< CmD*D0CH D¡BZE­BZ F»BZGiCN H,D2H,EH H,FsG`GS FµH4E±H4 D{H4D,G> CmFZCmE<"]], BB: 35, CB: 547, HB: -14, DB: 714, AB: 611 }; C["e"] = { sC: ["IeD¯ CmD¯ CmC­D0C6 D{BZE¥BZ GBBZG¡C© IVC© I2BaH1A¦ G0A%E¥A% C·A%B±B< A«CRA«EF A«G*B±HF C¿IiE}Ii GVIiHcHH IiG2IiEX IiE2IeD¯"], hC: [["CmF! G£F! G{F·G3Ge FmH4E}H4 D«H4D<Gg CqF»CmF!"]], BB: 35, CB: 531, HB: -14, DB: 531, AB: 556 }; C["é"] = D(C.e, "acute", 158, 0); C["è"] = D(C.e, "grave", 158, 0); C["ë"] = D(C.e, "dieresis", 158, 0); C["ê"] = D(C.e, "circumflex", 158, 0); C["f"] = { sC: ["B¡H! ATH! ATIL B¡IL B¡J! B¡KVCVKÃ C»LVD¿LV E­LVF<LH F<J¹ E³K!ERK! DcK!DcJ6 DcIL F#IL F#H! DcH! DcAB B¡AB B¡H!"], BB: 9, CB: 317, HB: 0, DB: 714, AB: 315 }; C["g"] = { sC: ["GµIL IwIL IwAy Iw>(E{>( DF>(CL>o B:?BB,@k C³@k D0?RE«?R Gµ?RGµAZ GµBy G±By G(ABEXAB CoABBwBe A«CsA«Ec A«G<B§HN C©IiE]Ii G:IiG±H> GµH> GµIL"], hC: [["E}Bw F«BwGRCi GµDJGµE_ GµFqGRGL F«H4E}H4 DqH4D(G@ CmFaCmEL CmD@D,Cc DwBwE}Bw"]], BB: 35, CB: 538, HB: -205, DB: 531, AB: 593 }; C["h"] = { sC: ["CÁAB B:AB B:LV CÁLV CÁHD D!HD DNH¯DÄI: EuIiFXIi G§IiHfH± IFH4IFF« IFAB GcAB GcFL GcH4E»H4 E(H4DdGg CÁF»CÁF# CÁAB"], BB: 60, CB: 514, HB: 0, DB: 714, AB: 574 }; C["i"] = { sC: ["D#J¡ B@J¡ B@LV D#LV D#J¡", "D#AB B@AB B@IL D#IL D#AB"], BB: 63, CB: 177, HB: 0, DB: 714, AB: 241 }; C["i"] = { sC: ["D#AB B@AB B@IL D#IL D#AB"], BB: 63, CB: 177, HB: 0, DB: 500, AB: 241 }; C["í"] = D(C["i"], "acute", 0, 0); C["ì"] = D(C["i"], "grave", 0, 0); C["ï"] = D(C["i"], "dieresis", 0, 0); C["î"] = D(C["i"], "circumflex", 0, 0); C["j"] = { sC: ["D#J¡ B@J¡ B@LV D#LV D#J¡", "B@@u B@IL D#IL D#@k D#>(A}>( AR>(@¹>0 @¹?e AR?]Ae?] AÁ?]B2?¥ B@?ÃB@@u"], BB: -22, CB: 177, HB: -205, DB: 714, AB: 241 }; C["k"] = { sC: ["D#AB B@AB B@LV D#LV D#F* G@IL IXIL FLFP I¡AB GiAB E,E8 D#D4 D#AB"], BB: 63, CB: 542, HB: 0, DB: 714, AB: 537 }; C["l"] = { sC: ["D#AB B@AB B@LV D#LV D#AB"], BB: 63, CB: 177, HB: 0, DB: 714, AB: 241 }; C["m"] = { sC: ["CÁAB B:AB B:IL CµIL CµH< C»H< D­IiFVIi H4IiHyH< IuIiK<Ii M¹IiM¹F¯ M¹AB L2AB L2EÁ L2G0K¹Gg KqH4JwH4 H½H4H½EÃ H½AB G6AB G6FZ G6GJF°G¢ FeH4E£H4 E!H4DaGm CÁG#CÁF( CÁAB"], BB: 60, CB: 810, HB: 0, DB: 531, AB: 870 }; C["n"] = { sC: ["CÁAB B:AB B:IL CµIL CµH4 C¹H0 D§IiFXIi G§IiHfH± IFH4IFF« IFAB GcAB GcFL GcH4E»H4 E(H4DdGg CÁF»CÁF# CÁAB"], BB: 60, CB: 514, HB: 0, DB: 531, AB: 574 }; C["ñ"] = D(C.n, "tilde", 167, 0); C["n"] = D(C.n, "acute", 167, 0); C["o"] = { sC: ["E·A% CÃA%BµB@ A­CTA­EH A­G:B¸HQ CÃIiE·Ii G«IiH¹HN IÁG:IÁEH IÁCTH¹B@ G«A%E·A%"], hC: [["E·BZ G#BZGuCN H:D2H:EH H:F]GuG@ G#H4E·H4 D§H4D4G@ CoF]CoEH CoD2D4CN D§BZE·BZ"]], BB: 36, CB: 558, HB: -14, DB: 531, AB: 593 }; C["ô"] = D(C.o, "circumflex", 176, 0); C["ò"] = D(C.o, "grave", 176, 0); C["ó"] = D(C.o, "acute", 176, 0); C["ö"] = D(C.o, "dieresis", 176, 0); C["p"] = { sC: ["D#>D B@>D B@IL C»IL C»H@ C¿H@ DyIiF]Ii HFIiIHHF J@G2J@EB J@CaITBL HZA%F¥A% D±A%D(BH D#BH D#>D"], hC: [["H]EF H]F]G·GD GDH4F>H4 E2H4DhGR C¿FqC¿EF C¿D%DkC@ E8BZF>BZ GNBZG¿CL H]D.H]EF"]], BB: 63, CB: 575, HB: -191, DB: 531, AB: 611 }; C["q"] = { sC: ["H0IL I«IL I«>D H#>D H#BH GÃBH G:A%EFA% CoA%BuBL A«CaA«EB A«G2B£HF C¥IiEmIi GPIiH,H@ H0H@ H0IL"], hC: [["CmEF CmD.D.CL D{BZE­BZ F½BZGgC@ H,CÁH,EF H,FqGbGR F¹H4E­H4 D§H4D4GD CmF]CmEF"]], BB: 35, CB: 547, HB: -191, DB: 531, AB: 611 }; C["r"] = { sC: ["CÁAB B:AB B:IL C³IL C³G§ C·G§ D(HZD¥HÄ E]IiFBIi F]IiF»Ic F»G© FHG³F6G³ E<G³DqG4 CÁFTCÁE. CÁAB"], BB: 60, CB: 363, HB: 0, DB: 531, AB: 352 }; C["s"] = { sC: ["A¥C± CgC± CwBZEPBZ G<BZG6Cc G2DBE¥Dm C]E4CDE@ A»E¯A»G@ A»HZC*I( CÁIiEHIi FwIiGgHÃ HeHLHyG* F­G* FqH4E8H4 C}H4C}GJ C}F¥DgF] D{FTFLF# GiE£H2EL H½D£H½Cw H½BLG§As F©A%ELA% C£A%B«A¡ A§B_A¥C±"], BB: 32, CB: 492, HB: -14, DB: 531, AB: 519 }; C["t"] = { sC: ["B¡H! ARH! ARIL B¡IL B¡K¥ DcK¥ DcIL F0IL F0H! DcH! DcC{ DcC*DsB³ D«BmEPBm E³BmF0Bu F0AD D½A8D¿A8 CuA8C4A} B¡B4B¡C@ B¡H!"], BB: 8, CB: 311, HB: -5, DB: 672, AB: 333 }; C["u"] = { sC: ["GcIL IFIL IFAB GgAB GgBR GcBR G8A©FfAV EµA%E<A% B:A%B:D< B:IL CÁIL CÁDR CÁBZEeBZ GcBZGcDu GcIL"], BB: 60, CB: 514, HB: -14, DB: 517, AB: 574 }; C["ú"] = D(C.u, "acute", 167, 0); C["ù"] = D(C.u, "grave", 167, 0); C["ü"] = D(C.u, "dieresis", 167, 0); C["û"] = D(C.u, "circumflex", 167, 0); C["v"] = { sC: ["FLAB DLAB ATIL CLIL ERC2 EVC2 GRIL I>IL FLAB"], BB: 9, CB: 510, HB: 0, DB: 517, AB: 519 }; C["w"] = { sC: ["E¯AB C¿AB A]IL CNIL D»CH D¿CH F_IL HDIL I¡CH I¥CH KTIL M<IL JyAB H±AB GNGB GJGB E¯AB"], BB: 13, CB: 765, HB: 0, DB: 517, AB: 778 }; C["x"] = { sC: ["CVAB AJAB DPEc AkIL C¡IL EVF± G8IL I@IL FaEo ImAB GZAB ETD@ CVAB"], BB: 4, CB: 533, HB: 0, DB: 517, AB: 537 }; C["y"] = { sC: ["D6@w DPAF AHIL CBIL EPCH ETCH GZIL IHIL F6@­ Es?RE>>µ Di>(CH>( By>(B*>4 B*?u B¡?gB¹?g C_?gC§?± CÁ@*D6@w"], BB: 3, CB: 515, HB: -205, DB: 517, AB: 519 }; C["ÿ"] = D(C.y, "dieresis", 139, 0); C["z"] = { sC: ["F*G» A¹G» A¹IL H_IL H_H, C±Bw H}Bw H}AB AoAB AoBc F*G»"], BB: 22, CB: 477, HB: 0, DB: 517, AB: 500 }; C["A"] = { sC: ["C6AB A4AB EXLV GcLV K«AB I}AB HwD< D<D< C6AB"], hC: [["F_Ja FXJa D£E{ H4E{ F_Ja"]], BB: -7, CB: 675, HB: 0, DB: 714, AB: 667 }; C["Á"] = D(C.A, "acute", 197, 213); C["À"] = D(C.A, "grave", 197, 213); C["Ã"] = D(C.A, "tilde", 197, 213); C["Â"] = D(C.A, "circumflex", 197, 213); C["Ä"] = D(C.A, "dieresis", 197, 213); C["Å"] = D(C.A, "ring", 197, 213); C["Æ"] = { sC: ["CJAB A4AB F{LV O{LV O{J¡ JBJ¡ JBG« ONG« ONF< JBF< JBB½ O©B½ O©AB HTAB HTD0 DwD0 CJAB"], hC: [["HTJ¡ G¯J¡ EREo HTEo HTJ¡"]], BB: -7, CB: 930, HB: 0, DB: 714, AB: 963 }; C["B"] = { sC: ["GkAB BZAB BZLV G³LV IVLVJGK} K8K!K8Iu K8G¿ImGD ImG@ KyF©KyDP KyBÁJ}B6 IsABGkAB"], hC: [["G±FL DTFL DTB± G±B± I¡B±I¡Dq I¡FLG±FL", "GmJ­ DTJ­ DTG£ GmG£ HHG£H¦H4 I>HiI>IF I>J­GmJ­"]], BB: 76, CB: 667, HB: 0, DB: 714, AB: 704 }; C["C"] = { sC: ["K»H³ IÁH³ IVK,G:K, EeK,DoI¥ C«HoC«F¯ C«E*DoC¹ EeBmG:Bm HZBmI<CZ I¹D>J%Ec K½Ec K­CaJdB@ I<@ÃG:@Ã D¥@ÃCDB¡ A±DPA±F¯ A±IJCDJ¿ D¥LyG:Ly I0LyJVKy K¥JsK»H³"], BB: 38, CB: 684, HB: -17, DB: 731, AB: 722 }; C["D"] = { sC: ["G*AB BZAB BZLV G*LV IeLVJ­J§ KÃIHKÃF¯ KÃDPJ­B· IeABG*AB"], hC: [["FJJ­ DTJ­ DTB± FJB± HZB±ILD! J%D½J%F¯ J%H¡ILIw HZJ­FJJ­"]], BB: 76, CB: 687, HB: 0, DB: 714, AB: 722 }; C["E"] = { sC: ["JmAB BZAB BZLV J_LV J_J¡ DTJ¡ DTG« J#G« J#F< DTF< DTB½ JmB½ JmAB"], BB: 76, CB: 597, HB: 0, DB: 714, AB: 630 }; C["É"] = D(C.E, "acute", 195, 197); C["È"] = D(C.E, "grave", 195, 197); C["Ê"] = D(C.E, "circumflex", 195, 197); C["Ë"] = D(C.E, "dieresis", 195, 197); C["F"] = { sC: ["DTAB BZAB BZLV J4LV J4J¡ DTJ¡ DTG« IZG« IZF< DTF< DTAB"], BB: 76, CB: 569, HB: 0, DB: 714, AB: 593 }; C["G"] = { sC: ["GXG2 L8G2 L8AB J»AB JsBk I³A{I-AM HJ@ÃGD@Ã D¯@ÃCNB¡ A»DPA»F¯ A»IHCNJ¿ D¯LyGDLy I8LyJ]K} K¯J{L(H³ J4H³ J!I»I6Je HRK,GDK, EoK,DyI¥ CµHoCµF¯ CµE*DyC¹ EmBoGDBm H¥BkIjCS JPD<JTEu GXEu GXG2"], BB: 43, CB: 699, HB: -17, DB: 731, AB: 759 }; C["H"] = { sC: ["DNAB BTAB BTLV DNLV DNGÁ IXGÁ IXLV KRLV KRAB IXAB IXFF DNFF DNAB"], BB: 73, CB: 648, HB: 0, DB: 714, AB: 722 }; C["I"] = { sC: ["DTAB BZAB BZLV DTLV DTAB"], BB: 76, CB: 201, HB: 0, DB: 714, AB: 278 }; C["J"] = { sC: ["FcLV H]LV H]D± H]C,G­B: F¿@ÃD©@Ã C.@ÃB@B# A]B½A]Dk A]E6 CVE6 CVDm CVCmC£C0 D.BmD½Bm E±BmF:C4 FcCqFcD£ FcLV"], BB: 13, CB: 461, HB: -17, DB: 714, AB: 537 }; C["K"] = { sC: ["DTAB BZAB BZLV DTLV DTGL IPLV K§LV GJG¿ L,AB IuAB EÃFm DTE! DTAB"], BB: 76, CB: 693, HB: 0, DB: 714, AB: 685 }; C["L"] = { sC: ["J*AB BZAB BZLV DTLV DTB½ J*B½ J*AB"], BB: 76, CB: 564, HB: 0, DB: 714, AB: 574 }; C["M"] = { sC: ["DDAB BVAB BVLV E6LV H@Cy HDCy KDLV MÃLV MÃAB L2AB L2I³ L.I³ I!AB GTAB DHI³ DDI³ DDAB"], BB: 74, CB: 815, HB: 0, DB: 714, AB: 889 }; C["N"] = { sC: ["D>AB BPAB BPLV DXLV IeD: IiD: IiLV KVLV KVAB INAB DDI] D>I] D>AB"], BB: 71, CB: 650, HB: 0, DB: 714, AB: 722 }; C["Ñ"] = D(C.N, "tilde", 197, 241); C["O"] = { sC: ["G:Ly IsLyK0J¿ LgIHLgF¯ LgDPK0B¡ Is@ÃG:@Ã D¥@ÃCDB¡ A±DPA±F¯ A±IHCDJ¿ D¥LyG:Ly"], hC: [["G:K, EeK,DoI¥ C«HoC«F¯ C«E*DoC¹ EeBmG:Bm H³BmI©C¹ JmE*JmF¯ JmHoI©I¥ H³K,G:K,"]], BB: 38, CB: 722, HB: -17, DB: 731, AB: 760 }; C["Ó"] = D(C.O, "acute", 260, 197); C["Ò"] = D(C.O, "grave", 260, 197); C["Ô"] = D(C.O, "circumflex", 260, 197); C["Ö"] = D(C.O, "dieresis", 260, 197); C["Õ"] = D(C.O, "tilde", 260, 197); C["P"] = { sC: ["DTAB BZAB BZLV GPLV IaLVJ]K< K6JLK6H¿ K6GoJ]F£ IaEgGPEg DTEg DTAB"], hC: [["GFJ­ DTJ­ DTG2 GBG2 H%G2HkGe I<H!I<HÁ I<J­GFJ­"]], BB: 76, CB: 634, HB: 0, DB: 714, AB: 667 }; C["Q"] = { sC: ["J¿Bi LTAH KZ@@ I­Aw Hs@ÃG:@Ã D¥@ÃCDB¡ A±DPA±F¯ A±IHCDJ¿ D¥LyG:Ly IsLyK0J¿ LgIHLgF¯ LgD*J¿Bi"], hC: [["HZB± GJC¯ HBD¹ IqC¡ JmDµJmF¯ JmHoI©I¥ H³K,G:K, EeK,DoI¥ C«HoC«F¯ C«E*DoC¹ EeBmG:Bm G·BmHZB±"]], BB: 38, CB: 722, HB: -65, DB: 731, AB: 760 }; C["R"] = { sC: ["DTAB BZAB BZLV G§LV ImLVJeKr K]J¯K]IT K]G>IqFm IqFi KDFJKDD: KDA¹KµAB I©AB IaA£IaB· IaDcI(E4 HkE±GDE± DTE± DTAB"], hC: [["GkJ­ DTJ­ DTGL GoGL IcGLIcI0 IcJ­GkJ­"]], BB: 76, CB: 680, HB: 0, DB: 714, AB: 704 }; C["S"] = { sC: ["A§DÁ C¡DÁ C¡C¥DiC2 EFBmFiBm G¥BmHRC0 H¹CkH¹DD H¹EHGÃEu G³E{DwFk B:G@B:IT B:JÁC_Kµ DqLyFDLy H.LyIFK§ JiJ©JiI0 HoI0 H_K,F:K, ERK,D¯J© D4JTD4Is D4HiE_H; F«G±H{GL I£G#JLF8 J³EVJ³Da J³B£I_A« HD@ÃFX@Ã DT@ÃC6A½ A«BÃA§DÁ"], BB: 33, CB: 615, HB: -17, DB: 731, AB: 648 }; C["T"] = { sC: ["D¹J¡ ARJ¡ ARLV JVLV JVJ¡ F³J¡ F³AB D¹AB D¹J¡"], BB: 8, CB: 586, HB: 0, DB: 714, AB: 593 }; C["U"] = { sC: ["BJED BJLV DDLV DDE¹ DDDTDsC£ E<ByF·By HmByI6C£ IeDTIeE¹ IeLV K_LV K_ED K_C8J>B( I#@ÃF·@Ã D§@ÃCmB( BJC8BJED"], BB: 68, CB: 654, HB: -17, DB: 714, AB: 722 }; C["Ú"] = D(C.U, "acute", 241, 197); C["Ù"] = D(C.U, "grave", 241, 197); C["Û"] = D(C.U, "circumflex", 241, 197); C["Ü"] = D(C.U, "dieresis", 241, 197); C["V"] = { sC: ["G*AB D·AB A8LV C<LV F!Cm F%Cm H·LV JµLV G*AB"], BB: -5, CB: 616, HB: 0, DB: 714, AB: 611 }; C["W"] = { sC: ["FHAB DFAB ANLV CLLV ENCµ ERCµ GsLV IsLV K­Cµ K±Cµ M»LV O¹LV L¯AB J±AB HqI© HmI© FHAB"], BB: 6, CB: 938, HB: 0, DB: 714, AB: 944 }; C["X"] = { sC: ["A<AB E6G% A_LV C«LV FLH_ HÁLV K6LV G_G% KXAB I(AB FDEe CZAB A<AB"], BB: -3, CB: 651, HB: 0, DB: 714, AB: 648 }; C["Y"] = { sC: ["GHAB ENAB ENEs A6LV CXLV FRGV IFLV K_LV GHEs GHAB"], BB: -6, CB: 654, HB: 0, DB: 714, AB: 648 }; C["Z"] = { sC: ["H0J¡ B0J¡ B0LV JoLV JoJ» D.B½ J¥B½ J¥AB AqAB AqB± H0J¡"], BB: 23, CB: 608, HB: 0, DB: 714, AB: 630 }; C["¡"] = { sC: ["BRIi D_Ii D_Go BRGo BRIi", "C·FZ DVAm DV>T B]>T B]Am BÁFZ C·FZ"], BB: 72, CB: 206, HB: -183, DB: 531, AB: 278 }; C["!"] = { sC: ["D_AB BRAB BRC< D_C< D_AB", "BÁDP B]I: B]LV DVLV DVI: C·DP BÁDP"], BB: 72, CB: 206, HB: 0, DB: 714, AB: 278 }; C["|"] = { sC: ["C©@Ã B:@Ã B:Ly C©Ly C©@Ã"], BB: 60, CB: 162, HB: -17, DB: 731, AB: 222 }; C['"'] = { sC: ["F·H! EHH! EHLV F·LV F·H!", "D4H! BiH! BiLV D4LV D4H!"], BB: 83, CB: 361, HB: 432, DB: 714, AB: 444 }; C["'"] = { sC: ["D>H! BsH! BsLV D>LV D>H!"], BB: 88, CB: 190, HB: 432, DB: 714, AB: 278 }; C["#"] = { sC: ["GwE} HÃE} HÃDg GcDg G%AB E©AB F@Dg DeDg D(AB B«AB CBDg A©Dg A©E} CXE} C}G£ B@G£ B@H¹ C³H¹ DJL: EmL: E0H¹ F±H¹ GHL: HkL: H.H¹ IZH¹ IZG£ G½G£ GwE}"], hC: [["FVE} F{G£ D¿G£ DyE} FVE}"]], BB: 34, CB: 524, HB: 0, DB: 700, AB: 556 }; C["$"] = { sC: ["AeDu CHDu CDB]EHBT EHF8 CwFsB·G> A¥H,A¥Iq A¥K%B¯K· C¯LyEHLy EHM· EÁM· EÁLy G]LyHTK» ITK0ITIs GqIs GgKDEÁKD EÁGÁ G¡GcHgF· IyF%IyDc IyB¯HoA¹ GsA*EÁ@Ã EÁ?§ EH?§ EH@Ã CkA#BgAÂ AcB½AeDu"], hC: [["EÁF% EÁBT G·BgG·DB G·E(GHEa FµE«EÁF%", "EHH4 EHKD CgKDCgI£ CgHmEHH4"]], BB: 17, CB: 539, HB: -95, DB: 809, AB: 556 }; C["%"] = { sC: ["E4F: C«F:C2G0 BgG¹BgIH BgJwC6Ka C±LVE4LV FZLVG2Ka G¥JwG¥IH G¥G¹G6G0 FaF:E4F:", "LÃA% KuA%JÁA¿ JRB¥JRD4 JREcK!FL K{GBLÃGB NFGBNÁFL OoEcOoD4 OoB¥O!A¿ NLA%LÃA%", "Fg@µ EJ@µ KTLk LmLk Fg@µ"], hC: [["C½IH C½G<E2G< FNG<FNIH FNKTE2KT C½KTC½IH"], ["K©D4 K©B(LÁB( N:B(N:D4 N:F@LÁF@ K©F@K©D4"], []], BB: 82, CB: 918, HB: -24, DB: 724, AB: 1e3 }; C["&"] = { sC: ["KoAB IVAB HTBc G:A%EDA% C}A%B¢Aº A¥B«A¥DN A¥FDDJGm C:I!C:J# C:K<CÂK½ D§LyE»Ly G,LyG³L! H}KDH}J! H}HBF{G8 HXE, HyE©H§Fm JLFm J4D»I]C± KoAB"], hC: [["GZC{ EBFV D<E§D4E} CgE8CgDJ CgCZD%B½ DgBZELBZ F8BZF£B· FÃC,GZC{", "EÁKN E_KNE2K! D©JwD©J0 D©IuE4I0 E_H{E«HB FZH{F}I! G0I_G0J* G0JsF«JÃ FaKNEÁKN"]], BB: 32, CB: 662, HB: -14, DB: 731, AB: 648 }; C["{"] = { sC: ["A:D§ A:F8 AyF8B.FV BwF¡BwGJ BwJg BwKeCVL6 D#LyDwLy F,Ly F,KD E>KD DNKDDNJ8 DNG2 DNFHC¡E³ CHEkB¡Ea B¡E] DNEHDNC¡ DN@§ DN?yE>?y F,?y F,>D Dw>D D#>DCV>© Bw?XBw@V BwCc BwD8B.De AyD§A:D§"], BB: -4, CB: 309, HB: -191, DB: 731, AB: 296 }; C["}"] = { sC: ["E½F8 E½D§ E]D§E(Dg D_D>D_Cs D_@V D_?XC¡>© C0>DB_>D A(>D A(?y A¹?y B©?yB©@§ B©C­ B©DuCVE, C¯ERDVE] DVEa B©EuB©G> B©J8 B©KDA¹KD A(KD A(Ly B_Ly C0LyC¡L6 D_KeD_Jg D_GZ D_F§E(FX E]F8E½F8"], BB: -13, CB: 300, HB: -191, DB: 731, AB: 296 }; C["("] = { sC: ["E¡>D DD>D B#A±B#E_ B#I<DDLy E¡Ly C«I@C«E_ C«AeE¡>D"], BB: 49, CB: 286, HB: -191, DB: 731, AB: 278 }; C[")"] = { sC: ["A2Ly BmLy D¯I,D¯E] D¯A}Bm>D A2>D C(AyC(E] C(IVA2Ly"], BB: -8, CB: 229, HB: -191, DB: 731, AB: 278 }; C["*"] = { sC: ["B:H2 CFIo AiJ: A·K< CqJg CqLV DyLV DyJg FRK< F¥J: DÁIo F*H2 E@Ge D2I( C*Ge B:H2"], BB: 19, CB: 352, HB: 401, DB: 714, AB: 370 }; C["+"] = { sC: ["B!F! E4F! E4I6 F£I6 F£F! IµF! IµDV F£DV F£AB E4AB E4DV B!DV B!F!"], BB: 48, CB: 552, HB: 0, DB: 506, AB: 600 }; C[","] = { sC: ["CVAB BLAB BLCP DcCP DcAB Dc@HCº?t CL>ÁBT>© BT?£ B·?³C6@G CX@¡CVAB"], BB: 69, CB: 208, HB: -158, DB: 135, AB: 278 }; C["-"] = { sC: ["FkDw B#Dw B#FN FkFN FkDw"], BB: 49, CB: 340, HB: 218, DB: 326, AB: 389 }; C["."] = { sC: ["DcAB BLAB BLCP DcCP DcAB"], BB: 69, CB: 208, HB: 0, DB: 135, AB: 278 }; C["/"] = { sC: ["Bq@Ã @¹@Ã ETLy G.Ly Bq@Ã"], BB: -22, CB: 374, HB: -17, DB: 731, AB: 352 }; C[":"] = { sC: ["DcAB BLAB BLCP DcCP DcAB", "DcG( BLG( BLI6 DcI6 DcG("], BB: 69, CB: 208, HB: 0, DB: 506, AB: 278 }; C[";"] = { sC: ["DcG( BLG( BLI6 DcI6 DcG(", "CVAB BLAB BLCP DcCP DcAB Dc@HCº?t CL>ÁBT>© BT?£ B·?³C6@G CX@¡CVAB"], BB: 69, CB: 208, HB: -158, DB: 506, AB: 278 }; C["<"] = { sC: ["D*E< I¹B¡ I¹A2 AÁDu AÁE§ I¹IF I¹G{ D*E<"], BB: 46, CB: 554, HB: -8, DB: 514, AB: 600 }; C["="] = { sC: ["B!DX IµDX IµB¯ B!B¯ B!DX", "B!Gm IµGm IµEÃ B!EÃ B!Gm"], BB: 48, CB: 552, HB: 101, DB: 405, AB: 600 }; C[">"] = { sC: ["AÁA2 AÁB¡ G­E< AÁG{ AÁIF I¹E§ I¹Du AÁA2"], BB: 46, CB: 554, HB: -8, DB: 514, AB: 600 }; C["¿"] = { sC: ["DgGo DgIi FsIi FsGo DgGo", "GTA³ I8A³ I:@:H7?6 G4>2EX>2 C¿>2BÃ>¿ B#?©B#A< B#B8B]B¯ B{C<CWC­ D4DXDRD­ D§EXD§FZ F]FZ F]E4F6DZ E¹C±E@CD DcBsDNBZ CÁA¿CÁAD CÁ@_Dg?Ã DÁ?qEc?q FZ?qFº@> GT@¯GTA³"], BB: 49, CB: 507, HB: -200, DB: 531, AB: 556 }; C["?"] = { sC: ["FoAB DcAB DcC< FoC< FoAB", "C«H³ B#H³ B!JoC$Kt D(LyE§Ly GBLyH=K¯ I8JÃI8Ie I8HiH£G· HcGeG«F» G(FHF­E¹ FXEHFXDF D£DF D£EmE%FF EFFµE¿G] F{H.F±HF G>H§G>I] G>JJFyJ« F>K:E{K: C«K:C«H³"], BB: 49, CB: 507, HB: 0, DB: 731, AB: 556 }; C["@"] = { sC: ["I§I¡ J³I¡ I£Eq IqE2IqD¹ IqDgI·Dg JuDgKDEc K»FgK»G¹ K»IqJ{Jw IeKwG¥Kw E©KwDfJI CDH¿CDFÁ CDD¡DoCN EµB!G·B! J*B!KVCi LcCi K¥BNJdAx ID@ÃG¯@Ã ER@ÃC¡By B#DTB#G% B#IRC~K$ EVLyG¥Ly I·LyKVKT LÃJ*LÃH. LÃEÁKqDo J_CZIHCZ HXCZHRDN HNDN GiC]FoC] EsC]DÁD8 DJD·DJE¹ DJG_EBHy FDI¿G£I¿ H½I¿IaH¯ I§I¡"], hC: [["F·Ds G§DsHXEo I%F_I%GV I%G¿HxHQ HHH©G«H© F·H©F@G³ EuG#EuF( EuEXEÃE$ FLDsF·Ds"]], BB: 49, CB: 751, HB: -17, DB: 731, AB: 800 }; C["["] = { sC: ["E³>D BR>D BRLy E³Ly E³KD D*KD D*?y E³?y E³>D"], BB: 72, CB: 295, HB: -191, DB: 731, AB: 296 }; C["]"] = { sC: ["ADLy D¥Ly D¥>D AD>D AD?y C*?y C*KD ADKD ADLy"], BB: 1, CB: 224, HB: -191, DB: 731, AB: 296 }; C["^"] = { sC: ["E½JN D6Fa BkFa ERL: FcL: IJFa G¡Fa E½JN"], BB: 84, CB: 516, HB: 335, DB: 700, AB: 600 }; C["_"] = { sC: ["I*@, I*?H AB?H AB@, I*@,"], BB: 0, CB: 500, HB: -125, DB: -75, AB: 500 }; C[" "] = { sC: [], BB: 0, CB: 500, HB: -125, DB: -75, AB: 278 }; C[" "] = { sC: [], BB: 0, CB: 500, HB: -125, DB: -75, AB: 278 }; return C; function D(B, C, H, D) { var A = { BB: B.BB, CB: B.CB, HB: B.HB, DB: B.DB, AB: B.AB }, I = B.sC.map(B => B), x = typeof B.hC === "object" ? B.hC.map(B => B) : undefined, i = C === "dieresis" ? 2 : 1, L = C === "ring" ? 1 : 0; if (i === 2) { if (x) { x.unshift([]) } if (C === "dieresis") { I.unshift(e(H, D)) } } if (L) { if (typeof x !== "object") { x = B.sC.map(B => []) } if (C === "ring") { x.unshift(d(H, D)) } } else { if (x) { x.unshift([]) } } if (C === "dieresis") { A.DB = s(D); I.unshift(t(H, D)) } if (C === "circumflex") { A.DB = n(D); I.unshift(J(H, D)) } if (C === "acute") { A.DB = F(D); I.unshift(G(H, D)) } if (C === "grave") { A.DB = M(D); I.unshift(E(H, D)) } if (C === "tilde") { A.DB = h(D); I.unshift(u(H, D)) } if (C === "ring") { A.DB = o(D); I.unshift(c(H, D)) } A.sC = I; if (x) { A.hC = x } return A } function A(B, C) { return [[128 + B, 588 + C], [45 + B, 588 + C], [135 + B, 731 + C], [270 + B, 731 + C]] } function G(C, H) { return B(A(C, H)) } function F(B) { return 731 + B } function I(B, C) { return [[113 + B, 588 + C], [-29 + B, 731 + C], [105 + B, 731 + C], [196 + B, 588 + C]] } function E(C, H) { return B(I(C, H)) } function M(B) { return 731 + B } function x(B, C) { return [[120 + B, 678 + C], [50 + B, 588 + C], [-42 + B, 588 + C], [65 + B, 731 + C], [176 + B, 731 + C], [284 + B, 588 + C], [191 + B, 588 + C]] } function J(C, H) { return B(x(C, H)) } function n(B) { return 731 + B } function i(B, C) { return [[284 + B, 731 + C], [176 + B, 588 + C], [65 + B, 588 + C], [-42 + B, 731 + C], [50 + B, 731 + C], [120 + B, 642 + C], [191 + B, 731 + C]] } function L(C, H) { return B(i(C, H)) } function K(B) { return 731 + B } function a(B, C) { return [[92 + B, 599 + C], [-22 + B, 599 + C], [-22 + B, 707 + C], [92 + B, 707 + C]] } function t(C, H) { return B(a(C, H)) } function y(B, C) { return [[150 + B, 707 + C], [264 + B, 707 + C], [264 + B, 599 + C], [150 + B, 599 + C]] } function e(C, H) { return B(y(C, H)) } function s(B) { return 707 + B } function r(B, C) { return [[297 + B, 714 + C], [279 + B, 599 + C, 186 + B, 599 + C], [163 + B, 599 + C, 113.5 + B, 617.5 + C], [64 + B, 636 + C, 43 + B, 636 + C], [26 + B, 636 + C, 13.5 + B, 623 + C], [1 + B, 610 + C, 1 + B, 595 + C], [-56 + B, 595 + C], [-49 + B, 639 + C, -24 + B, 671 + C], [6 + B, 708 + C, 48 + B, 708 + C], [81 + B, 708 + C, 127.5 + B, 689 + C], [174 + B, 670 + C, 191 + B, 670 + C], [229 + B, 670 + C, 241 + B, 714 + C]] } function u(C, H) { return B(r(C, H)) } function h(B) { return 714 + B } function w(B, C) { return [[[60 + B, 652 + C], [60 + B, 628 + C, 78.5 + B, 609.5 + C], [97 + B, 591 + C, 121 + B, 591 + C], [146 + B, 591 + C, 164 + B, 609.5 + C], [182 + B, 628 + C, 182 + B, 652 + C], [182 + B, 677 + C, 164 + B, 695 + C], [146 + B, 713 + C, 121 + B, 713 + C], [97 + B, 713 + C, 78.5 + B, 695 + C], [60 + B, 677 + C, 60 + B, 652 + C]]] } function d(C, H) { return [B(w(C, H)[0])] } function f(B, C) { return [[121 + B, 549 + C], [80 + B, 549 + C, 49 + B, 580 + C], [18 + B, 611 + C, 18 + B, 652 + C], [18 + B, 694 + C, 49 + B, 724.5 + C], [80 + B, 755 + C, 121 + B, 755 + C], [163 + B, 755 + C, 193.5 + B, 724.5 + C], [224 + B, 694 + C, 224 + B, 652 + C], [224 + B, 611 + C, 193.5 + B, 580 + C], [163 + B, 549 + C, 121 + B, 549 + C]] } function c(C, H) { return B(f(C, H)) } function o(B) { return 755 + B } function N() { return [[177, 517], [177, 0], [63, 0], [63, 517]] } function V() { return B(N()) } } }.apply(C, D), A !== undefined && (B.exports = A)) }, function (B, C, H) { var D, A; !(D = [], A = function () { return function (B) { var C = { reverseHoles: false, reverseShapes: true }, H = " "; C["a"] = { sC: ['HD@¤ H1@¤G¤A, GUATG?At FbAAE½A& ES@°E"@° C>@°BVA± AtBªAtD¤ AtFnB¹G¸ D8I=E½I= FpI=GYH´ H^HZH^G° H^GtHJG_ H@G9H;Fe H5E²H4D® H3C´HECK HOBÃH¥AÂ H¬A±H¼Al HÂA[ HÂA4H¦@½ Hi@¤HD@¤'], hC: [["FzF( FzFRF¡F¦ F§G4F±Gm FkG¢FPGª F6G³F&G³ D²G³D!F¸ C4E¼C4Dy C4CXCmB« D$B8D¹B8 EuB8F5BZ FYBmF»C# FzE&FzF("]], BB: 24.5, CB: 494.5, HB: -32.5, DB: 509.5, AB: 511.5 }; C["á"] = D(C.a, "acute", 100, 0); C["à"] = D(C.a, "grave", 130, -17); C["ä"] = D(C.a, "dieresis", -24, 8); C["â"] = D(C.a, "circumflex", -9, 0); C["å"] = D(C.a, "ring", -10, -10); C["æ"] = { sC: ["GUAw G,AOFfA1 E¾@µEa@µ C°@µB©AÄ A¦C-A¦D¦ A¦FiC2G± D^I1FDI1 G)I1H0H¤ HPHxHVG¶ H°HdIpHµ JKI>K,I> LII>M/H­ N3HFN3G8 N3FUMAE§ L¶EdKwD¼ H£Ci IoBEKGBE K¹BELmBa MRB¢MzC3 MÃChNACh NdChN¡CN N»C4N»Bµ N»AÃMbAS LK@¸KG@¸ Ie@¸H}A¦ H£ApH¨AA H¬@»H:@» G©@»GrA2 GeAAGUAw"], hC: [["K,G± I=G±HqD¿ J°EÁ L6FoL»G@ LDG±K,G±", "GEGk F¤G¯ FoG¶F5G¶ D¾G¶D,F³ CBE·CBDx CBC}C¹B» DpB0EiB0 F*B0FbBI F»BcGEB¶ G/C²G/D8 G/FJGEGk"]], BB: 32.5, CB: 875, HB: -24, DB: 510, AB: 911.5 }; C["b"] = { sC: ["E´@» D}@»C¥AS CdA#C6A# B´A#BxA> B^AXB^A¢ B^A»B`BJ BcB}BcB¸ BcC~B]EK BWF½BWG¥ BWHIBXI³ BYKVBYKÂ BYLYBrL« BµMDCJMD C¶MDC¶Lp C¶LbC²LG C­L,C­KÂ CªJI C¨HP DZH¬E%I% EtICF6IC G«ICH®H! I©F­I©E. I©COHxB4 Gh@»E´@»"], hC: [["F6G­ EgG­DµG^ DjGGC©F~ C§ET C¨D; C©B¾ D5B©D­Bf EFBRE´BR FÂBRG{C6 HUC¼HUE. HUF?G®FÄ G<G­F6G­"]], BB: 74.5, CB: 546, HB: -21, DB: 769, AB: 593 }; C["c"] = { sC: ['E¦@§ D:@§C5A~ B(B}B(DL B(EµC,Gf D>IPEwIP FVIPGLI" HbHjHbG¹ HbGrHIGT H0G7G¯G7 GqG7G[GH GFGYG2Gk FzG»EwG» DµG»D1Fg CXECCXDL CXCKD0B¤ D¥B<E¦B< F=B<F£B[ GrBº G±C&G¾C& H?C&HYB­ HuBnHuBH HuA¤G^A? FZ@§E¦@§'], BB: 51, CB: 473, HB: -31, DB: 519, AB: 513.5 }; C["ç"] = { sC: ['G1?¥ G1>¬Fw>L F;=²EE=² Ds=²D(>. CJ>WCJ>Á CJ?SC°?S D0?SD]?; D¬?"E:?" Ek?#E¥?; E¼?QE¼?~ E¼@,Eu@Q EP@wD©@¶ CkA6B°B& B(BÂB(DL B(EµC,Gf D>IPEwIP FVIPGLI" HbHjHbG¹ HbGrHIGT H0G7G¯G7 GqG7G[GH GFGYG2Gk FzG»EwG» DµG»D1Fg CXECCXDL CXCKD0B¤ D¥B<E¦B< F=B<F£B[ GrBº G±C&G¾C& H?C&HYB­ HuBnHuBH HuAeF{@½ F¹@vG#@O G1@)G1?¥'], BB: 51, CB: 473, HB: -217.5, DB: 519, AB: 513.5 }; C["d"] = { sC: ["IMGÃ IAF³IAE¤ IAC;I`A¸ IbA«IbA¢ IbAXIFA? I*A$H©A$ HJA$H-A~ GhAIF¾A/ FP@¸E¡@¸ D4@¸C/A¾ B%C$B%D~ B%F¥C0GÂ D:I<EºI< F«I<GFH¼ H!HV H/KrHBL¢ HOMVH¾MV IuMVIuLx IuKqIMGÃ"], hC: [["E¾G© DxG©D$G$ CSFDCSD¤ CSC¦D,C( D©BME¡BM FPBMF«Bl G*B~GvC< G¦CIG´C[ G±D§ G²Ev G´Fi GmG7G/G` FrG©E¾G©"]], BB: 50, CB: 537, HB: -22.5, DB: 778, AB: 587 }; C["e"] = { sC: ['E´@¸ D5@¸C,A¦ A¹B~A¹DY A¹FWBµG¦ CºI>ExI> F¼I>G£Hª H¡HDH¡G8 H¡FWG²Eª G_EdF@D¼ CKCi C¥BºDSBo E$BEE´BE FUBEG/B` H"B¢HDC3 HfChH®Ch I-ChIHCN IdC4IdBµ IdB$H4AW FÂ@¸E´@¸'], hC: [["ExG± D£G±D1G2 CcFVC;D¿ EgF+ FºF¤GcG@ F±G±ExG±"]], BB: 42, CB: 528.5, HB: -22.5, DB: 510, AB: 547.5 }; C["é"] = D(C.e, "acute", 100, 0); C["è"] = D(C.e, "grave", 130, 0); C["ë"] = D(C.e, "dieresis", 24, 0); C["ê"] = D(C.e, "circumflex", 0, 0); C["f"] = { sC: ['GYKÂ EnKÂEQIV ENH½ FuI%G$I% H@I%H@HD H@G~GuGp GSGjG%Gl F{GmEEG^ E=E¢ E=EBEADI EECPEEB· EEA[E0@t DÂ@$DU@$ D-@$C³@? Cu@YCu@£ Cu@«Cw@· C®A¶C®C( C«E3 C«GN B±GDBnGD A®GDA®H" A®H¦C6H« C¶H® C¹IBD!IÃ D;KyD²L` EvM[GMM[ HXM[HXL} HXKÂGYKÂ'], BB: 36.5, CB: 459, HB: -78.5, DB: 780.5, AB: 508 }; C["g"] = { sC: ["HnDg HVAÁ HQ@[H.?` G¦>AG!=w F-<¾DO<¾ CM<¾Bv=, A{=EA{=µ A{>jBO>j Bs>jCD>X C¹>GD{>I F5>KF~?¡ G,@vG/Bm F{A®F1AZ EiA)D®A) CZA)BlB! A}B½A}D[ A}FcB¶G¦ D0I)F=I) F»I)GVHµ G¶H|H3HL H¿HIH¿GX H¿FµHªEÁ HrDºHnDg"], hC: [["F3G° D{G°C·F° C:E½C:Di C:C[CpB¶ D$BLD³BL EtBLFPC; G#D!G/Dª GDEqG[GR G4GqF­G¢ FaG°F3G°"]], BB: 28, CB: 493, HB: -275.5, DB: 499.5, AB: 530.5 }; C["h"] = { sC: ['H|@¨ H5@¨GÃAO G¬AÂGxC3 GfD@GfD¾ GfE5GiEi GkE¿GkF5 GkGnF±Gn EµGnE1F~ D¢FCD(DÄ D(B-C¬Aj CnA,C4A, B¯A,BnAG BOAdBOA­ BOAºBXB5 BaBMBdCC BgDT BiJ! BpJ¾BpKE BpKxBgL" B^LOB^L¢ B^M(BzMC B¸M_C>M_ C²M_C¿L« D,L)D,K^ D,JxD$Iª CÂHÀCÃH1 CÄG[ DrHGELH} F(I1F±I1 H0I1HnHH H»G¡HÁFN I%D¶ I9CH IGBVIZA¢ I_AoI_Ad I_A;IA@Ã I#@¨H|@¨'], BB: 70.5, CB: 526, HB: -30.5, DB: 782, AB: 577.5 }; C["i"] = { sC: ["D0D~ D0DBD3CN D7BYD7AÁ D7AtC¿AX C¥A=CWA= C-A=BµAX BxAtBxAÁ BxBYBuCN BqDBBqD~ BqEYB{Fc B§GlB§HG B§HtBÂH± C:I)CeI) C±I)D(H± DCHtDCHG DCGlD9Fc D0EYD0D~", "C§J¹ CUJ¹C3K7 B´KXB´Kª B´L6C3LW CULyC§Ly D3LyDTLW DwL6DwKª DwKXDTK7 D3J¹C§J¹"], BB: 87, CB: 218, HB: -2.5, DB: 731, AB: 280 }; C["i"] = { sC: ["D0D~ D0DBD3CN D7BYD7AÁ D7AtC¿AX C¥A=CWA= C-A=BµAX BxAtBxAÁ BxBYBuCN BqDBBqD~ BqEYB{Fc B§GlB§HG B§HtBÂH± C:I)CeI) C±I)D(H± DCHtDCHG DCGlD9Fc D0EYD0D~"], BB: 87, CB: 218, HB: -2.5, DB: 730, AB: 280 }; C["í"] = D(C["i"], "acute", -20, 0); C["ì"] = D(C["i"], "grave", -20, 0); C["ï"] = D(C["i"], "dieresis", -120, 0); C["î"] = D(C["i"], "circumflex", -60, 0); C["j"] = { sC: ["D¥?` D¦@QDbD( D?HB D?HtD[H¼ DxI?E!I? ECI?EeI& E©H±E«Hv F(DB FB?j FB>bEr=t D¼<{C¾<{ BI<{A<?> A0?XA0?n A0?·AO@0 An@LA¸@L BN@LB°?M B¿?,CC>o Cj>=C¾>= DF>=De>~ D}?.D¥?`", "D­J¸ D[J¸D9K6 CºKWCºK¨ CºL4D9LU D[LwD­Lw E8LwE[LU E~L4E~K¨ E~KWE[K6 E8J¸D­J¸"], BB: -9, CB: 320, HB: -292, DB: 730, AB: 403 }; C["k"] = { sC: ['Hx@¼ HA@¼H#AR GrB5F­C; E_E& E$D{D.D) D"BµD"A¥ D"AVC«A; Cn@ÂCC@Â Bb@ÂBbB# BbBvBmCº BxE8BxE¬ BxFÁB}H^ B£I¿B£K. B£KZB}K¹ BxLQBxL~ BxM)BµME C-MaCWMa C¤MaC¿ME D7M)D7L~ D7LPD;K¶ D@KVD@K) D9Hp D5GED7E¾ E;F¤F6G{ G°IW H-IzHSIz HzIzHºIZ I6I<I6H· I6HtH½HS H!GFFsF$ HGC¦ I]B7I]Az I]ARI>A6 HÂ@¼Hx@¼'], BB: 79.5, CB: 525, HB: -20.5, DB: 783, AB: 540 }; C["l"] = { sC: ["DAGA D3C] D3B²D+Az CÄ@»CK@» Bl@»BlA| BlBrBwD_ B¤FKB¤GA B¤H[B©J! B®KjB®L¦ B®MfCkMf DKMfDKL¦ DKKjDFJ! DAH[DAGA"], BB: 84.5, CB: 196.5, HB: -21, DB: 785.5, AB: 273.5 }; C["m"] = { sC: ['KÄ@q KQ@qKDAE K2B1JÄCu J¢F" JwFgJ_G& J=G¢I¹G¢ IsG¢H²GA H1F«G·Fg G¶E­G¼E/ H6C* HIA³HIA+ HI@£H.@e G¶@HGj@H G?@HG#@e F¬@£F¬A+ F¬AÄFrC« FZEpFZFf FZGMF<G© EyGhE2FÄ D>EÃ D/E¬C°Ec C°E(C¥D6 CxCCCxB° CxBpC£B; C­A©C­Ao C­AFCmA+ CN@³C%@³ B8@³B8B® B8CEBBD9 BME.BMEi BME¿BDF§ B;GlB;GÃ B;I~BÁI~ CDI~CeI] C§I;C§H· C§H¤C¢HZ C{H3C{GÂ C}G8 D/GÄD´Hv EuIJF9IJ GSIJG¯H1 HBHzH¯H¿ IVI@J6I@ KYI@K¸G³ KÃGnL=E¡ LXDVL¦AN L©A&Lj@¯ LK@qKÄ@q'], BB: 59, CB: 736.5, HB: -61, DB: 541.5, AB: 776.5 }; C["n"] = { sC: ["H6@} Gc@}GXAX G<C. G/CÃG/D§ G/DÂG2Ea G5F!G5F= G5G³FhG³ E{G³D¹F± D<E»C­Dd C«D=C¤C§ C|CSC|C$ C|B«C¤BM CªA¶CªAv CªAICmA. CQ@¶C&@¶ B}@¶BcA. BGAIBGAv BGA¶BABM B;B«B;C$ B;C­BIE< BWFoBWGS BWGsBSH/ BPHnBPH¯ BPI6BmIQ B«ImC1Im C®ImC¶Hn C¹G| E:IUFhIU G¦IUHAHL HlGqHpF< HpEZ HoD¢ HoD.H¦C- H»B-H»A^ H»A2H}@º Ha@}H6@}"], BB: 60.5, CB: 491, HB: -35, DB: 533, AB: 523 }; C["ñ"] = D(C.n, "tilde", -32, 0); C["o"] = { sC: ["E7@« C¶@«BÀA¤ A¼B«A¶Dl A°FHB¥Gq C®I6E¢I6 GBI6H&G¦ HxFtHuE( HrCOG¦B6 F©@«E7@«"], hC: [["EsGq DcGrCµFh CSEzCSDl CSC_CÃB² DbBME7BM EÀBMFgBº G9CjG>Dv GLGpEsGq"]], BB: 40.5, CB: 473, HB: -29, DB: 506, AB: 525.5 }; C["ô"] = D(C.o, "circumflex", -32, 0); C["ò"] = D(C.o, "grave", 120, 0); C["ó"] = D(C.o, "acute", 90, 0); C["ö"] = D(C.o, "dieresis", -40, 0); C["p"] = { sC: ["Ei@Â Dª@ÂC´A? C²=m C²=ACv=$ CZ<­C0<­ B©<­Bl=$ BP=ABP=m BS@s BSCy BPENBDF¡ B6HD B6H¬BOI9 BmItC#It CJItCeIX C¡I=C¡H¹ C¡H°C|Hw CwHWCuH> DHHyD¹H¸ EeI1F,I1 GuI1HQG£ H½FtH½D¯ H½C9H)B0 G0@ÂEi@Â"], hC: [['F,Go ERGoD­GF DVG*CªF_ C¶D¤C¶B° D¡BeEiBe FcBeG"C> GZC±GZD¯ GZF=G/F¹ F§GoF,Go']], BB: 58, CB: 492, HB: -284, DB: 536.5, AB: 534.5 }; C["q"] = { sC: ['H9Cv G¯@¡ Gu?-Gu=§ Gu=YGY=> G?="F·=" F:="F4=¨ F2>0F9>s FF?_ FYA6 E¨@ÂEc@Â C±@ÂB­A± A}B§A}DU A}FtBÀGÃ DBIRF_IP F·IPG/I% GYIKG{IK GÄIKH>I+ HZH¯HZHe HZFDH9Cv'], hC: [['E¼H& DfG©C­Fq C?EwC?DQ C?C_C©B¸ DSBEE]BI F8BLFdC. FµC¾F¸F! G"H& F²GÃF_H# F)H*E¼H&']], BB: 29, CB: 460, HB: -271.5, DB: 519, AB: 520 }; C["r"] = { sC: ["HAF¶ H:E¼G`E¼ F®E¼F®F{ F®F¯F«G> F©G³ ElG¡D±G9 D8F{C¡E{ C£Ad C£@£BÂ@£ BI@£BIAd BIF³ BIG0BLGr BNH1BNHR BNI4C#I4 C§I4C¨Gµ E@IGG$IG GuIGG¾H® HBHPHBGX HBG$HAF¶"], BB: 67.5, CB: 448, HB: -33, DB: 514.5, AB: 480 }; C["s"] = { sC: ['G]G1 G&G1F´GV F¦GpFyH? F/H,D¹G| CzG<CyFa C¸FVD2FQ EµF)F£Ec GÂD}GÂC: GÂA½F¸AI F"@ªDu@ª Cu@ªB£A2 AkAjAkBJ AkBrA«B² B&C,BNC, BmC,B¿B~ C4BhC©BX DGBLDuBL EFBLE¨Ba F`B}F`C: F`D>E%Dn D@D§ C>DÃB«EF B9E~B9Fl B9H7CzH± D4I)E5IM F5IsFnI® F¸IÀGDIÀ GoIÀG¬I¤ H#IgH#I: H#HÁH0Hh H<H0H<G· H<GiGÄGM G©G1G]G1'], BB: 20, CB: 445, HB: -29.5, DB: 557.5, AB: 486.5 }; C["t"] = { sC: ['GWG¥ GBG¥G%G¦ F­G¨FwG¨ F`G¨ErGx E§C6 E¨B® E©BY E¬@¦DÂ@¦ Dy@¦D[@¿ D>A6D>A] D>A¤DABK DDB¸DDC; D1Gv CjGyBXG¨ A¤G´A¤Hg A¤H´A¾I- B6IJB`IJ D,I9 D,IlD&J> D"JµD"K7 D"KaD?K| D]K¹D¨K¹ E^K¹ElJ© EoJcEoJ/ EmIx ElI: FeIJFwIJ G[IJG|I@ H6I,H6He H6H9G¾GÀ G¤G¥GWG¥'], BB: 31.5, CB: 442, HB: -31.5, DB: 682, AB: 471 }; C["u"] = { sC: ["HyHn HgE} HgE5HhD) HiB¿HiBV HiB@HlA¸ HpAjHpAS HpA)HS@± H6@tG°@t GB@tG.AP F3@´D·@´ C·@´C@AI BeA«BRB£ B,D¦B,FM B,GSBIH¡ BWISC%IS CPISCmI8 C¬HÀC¬Ht C¬HFC{Gd CmF¤CmFM CmE*CxD6 C¥CACºB| D8BjDWBa DwBWD·BW EºBWG)B¤ G(DG G%E¨ G%GXG8Ht GCIMGºIM HAIMH^I1 H{H¹HyHn"], BB: 53, CB: 475, HB: -39.5, DB: 520.5, AB: 520 }; C["ú"] = D(C.u, "acute", 90, 0); C["ù"] = D(C.u, "grave", 120, 0); C["ü"] = D(C.u, "dieresis", -40, 0); C["û"] = D(C.u, "circumflex", 0, 0); C["v"] = { sC: ["GTEA E®Au E¬@½E3@½ Dl@½DKAo C6D| A«H; A¡HUA¡Hi A¡H³A¿I, B;IIBdII BÀIIC7H° E/Cd EyD¢FhG( F¥GwG:H§ GYICG³IC H8ICHVI& HvH­HvHd HvH>GTEA"], BB: 30, CB: 473.5, HB: -20, DB: 515.5, AB: 486 }; C["w"] = { sC: ["KZH, J±EnI¶B] IyA¦I8A$ H¹@rH[@s Gr@uG5B| G!COF°Da FnF9 EÀD¢ D¬Al D}AFDdA3 DF@{C©@y C;@vBwB¾ BSD3B0F5 A»GH A¯GÃA¯H[ A¯H§B)HÂ BEI:BoI: C9I:CJHj CWH/C`GZ CnFK D&B· D¶EAE«HJ F(I6FyI6 GEI6GaH= G{GKGÃE_ HGChHfB_ I,Dh J*H} J9I7J¡I7 K&I7KFH¾ KeH£KeHX KeHTKZH,"], BB: 37, CB: 657, HB: -40, DB: 508, AB: 684 }; C["x"] = { sC: ['IKGª H<F¥ F±EU IMB5 IfA¸IfAx IfAQIHA4 I*@ºH¨@º Ha@ºHBA; GiB"E©DM DGB¬ C±BUBÂAi B£ADB]AD B7ADA½Ac A~A¢A~B$ A~BCA¸Bd B1BªBkC: C.CvCCC¯ D¶Ef C¶FÁ CFG¯B°H? BiHaBiHª BiI.B¦IM BÂIlCCIl C~IlDrHU E½Fl GYG¾ HQH®H|IK H½IzIEIz IlIzI«I] J%I@J%H¾ J%HfIKGª'], BB: 29.5, CB: 562, HB: -21.5, DB: 539.5, AB: 590 }; C["y"] = { sC: ["HÀH) FKBN EN@DD¯>³ DK=R D2<¯Ct<¯ CJ<¯C,=& B²=BB²=k B²>KDcAÂ A§G@ AXGª A>H4A>HS A>H|A]H¼ A|I7AÄI7 BNI7BhH¸ C°G/EKC¨ F]FV G*G§GsH¥ G´I9HDI9 HmI9H®HÀ I)H£I)HY I)HDHÀH)"], BB: -2, CB: 499.5, HB: -283, DB: 507.5, AB: 520.5 }; C["z"] = { sC: ["HpGX G»FpF³E) EtCBE*Bd E³BiF]Bi F¦BiGNBY G¼BJH?BJ HkBJH¨B. HÃA¶HÃAi HÃA<H¨@Ã Hk@¨H?@¨ G¼@¨GN@· F¦A!F]A! D¤A!C;@{ C&@wBº@w B9@wB9AI B9A{BjB& DiC±F·Gv EµGnEXGn DGGnC/G¦ BXG³BXHe BXH²BsI, B°IIC5II CfIIDEI> E%I2EXI2 E½I2FÂI< H#IEHgIE I9IEI9H£ I9H1HpGX"], BB: 59.5, CB: 507.5, HB: -38, DB: 515.5, AB: 538 }; C["A"] = { sC: ["J©A# J,A#IkB® IQCdI*E> HGE1G%D° E!DX DrCXC|Ac C]A+C%A+ B¢A+BaAG BAAeBAA± BAB=CUDs CDD¯CDE- CDE}D#Eµ D¶GdF=It H$LfH^Lf I*LfIGKz I§I1 J¹C® KMBq KkAÄKkAª KkA^KLAA K-A#J©A#"], hC: [["H~Fª H-I£ E¹F> F¯F]H~Fª"]], BB: 63.5, CB: 660, HB: -15, DB: 721.5, AB: 731 }; C["Á"] = D(C.A, "acute", 200, 200); C["À"] = D(C.A, "grave", 300, 200); C["Ä"] = D(C.A, "dieresis", 160, 200); C["Â"] = D(C.A, "circumflex", 100, 200); C["Å"] = D(C.A, "ring", 180, 180); C["Æ"] = { sC: ["J%FR I?FOGÀF? E¶F& E>E3C»C/ C!A{ B¥AMBTAM B-AMA±Ak AoAªAoB. AoBHA¤Bg D1FVE²HY G¼K+ IIL¤JNM? JpMNJµMN K;MNKXM2 LMMQM5Mb MÀMrNzMr PzMrQuM8 R6L½R6LZ R6L1Q½Kµ Q¡KuQVKu QJKuQ8Ky O¤L&NzL& N)L&MJK¼ LmK­K¡Km KªK.KªJ© KªI~KxG´ O!H: PXHNP­HN Q6HNQRH1 QoG·QoGi QoF¹P¸F¨ O-Fr KkFG KbE<KbDQ KbBuK£BS K¾B8L½B8 MVB8NPB; OIB>OªB> O¼B>P?BD PgBJPzBJ QbBJQbAg Qb@»P±@¦ P;@oO;@n Mg@o KJ@oJsAM IÁB(IÁDQ IÁE@J%FR"], hC: [['HwIi G<G{ I+G´J3G· JDI£JDJ© JDK"J?KI IfJxHwIi']], BB: 22, CB: 1082, HB: -42.5, DB: 791.5, AB: 1086.5 }; C["B"] = { sC: ['H"Aj FG@¶Cr@¶ CG@¶C!A: B}AcB}A¯ B}D( B}E4B±G6 BÄINC"JK C!K#C.LV C5LªCNLº DSM@E}M@ G(M@HFLJ I~KDI~I~ I~G¦H9Fs ILF3I·Eh J^D¾J^DA J^CKI^B^ H§A²H"Aj'], hC: [['FjEk E¥E| EvE|E[Ez EAEyE4Ey D¢EyDCE¤ D=D©D=D$ D=B[ F=BeG_C" H"C=HbCv HÀD(HÀDA HÀDpGÃE) GBEUFjEk', "E}Ky D´KyDgKs DeJG DQGM E]GAEfGB FzGNGWGÁ H;HvH;I~ H;JZGUK) FoKyE}Ky"]], BB: 93, CB: 589.5, HB: -23.5, DB: 767, AB: 630 }; C["C"] = { sC: ['IyI¬ I9I¬H½JR H¢J´HhJÂ HSK)G¥K) FuK)EGIQ C^G.C^E) C^D+D.CP D¤BsEwBs F[BsG@C% GzCCHoC¼ I%DBIBDB ImDBI«D" J$C¦J$C] J$C0I¢B² G¡A*EwA* D,A*BÃBE A¼C]A¼E) A¼GuD/JP E¹LsG¥Ls H1LsHWLn H¡LjH¾L` I=L´IuL´ J7L´JIL8 JXKjJXJw JXJNJCJ/ J(I¬IyI¬'], BB: 43.5, CB: 587, HB: -12, DB: 743.5, AB: 602.5 }; C["Ç"] = { sC: ['GG@7 GG>¹F>>[ Ed>4D*>4 C+>4C+>£ C+?ICs?I C§?ID)?H DN?FDb?F F4?FF4@7 F4@zEM@Ä D0AX C$B)B`BÀ A¼C´A¼E) A¼GsD/JP E¸LsG¥Ls H0LsHWLn H¡LjH¾L` I=L´IuL´ J9L´JOKÃ JXKoJXJw JXJIJ?J* J#I¬IyI¬ I:I¬H½JR H~J¶HdJÃ HQK)G¥K) FuK)EGIQ C^G-C^E) C^D/D,CS D¡BsEwBs FZBsGBC( GxCCH]C¯ I(DBIBDB IkDBIªD" J$C§J$C] J$B´H£B- GzA[FµA@ GG@¡GG@7'], BB: 43.5, CB: 587, HB: -199, DB: 743.5, AB: 602.5 }; C["D"] = { sC: ["I]AH HE@bF*@b Ec@bDª@x C»@µCbA< CWA< C-A<B´AY BuAwBuAÃ BuBªB~DS BªEÃBªF© BªGzB¥I] B¡K?B¡L1 B¡LYC&L¨ CPM1CzM1 C³M1D¸Lq F,L%FCKÂ HXK@I¿I} K¤G·K¤E¢ K¤DXK3C> JeB$I]AH"], hC: [["G²IR G,I¶DCK2 DHH¼ DKF¤ D;Bl DBBiDPB` E%B$F)B$ GªB$HnBj ILC*I§Cº J<D§J<E{ J<G°G²IR"]], BB: 89, CB: 671.5, HB: -48.5, DB: 759.5, AB: 721.5 }; C["E"] = { sC: ['I¥Ke IvKeIeKj H?K»G%K» FVK»ExK¬ D»K{D+K] D4JÀD4Jx D4IpD"G¥ GOH+ H®H>I6H> IbH>I¡H" I¿GªI¿GY I¿F¤IBFw GYFb C¹F8 CµEtC³E5 C±DxC±DA C±BjD-BC DDB(EFB( E¦B(F}B+ GwB/H3B/ HGB/HnB5 H¶B<I%B< I°B<I°AV I°@§I:@t H_@bF-@b C¡@bC(A1 BJA«BJDA BJD£BMEJ BPE·BUFk BJF¤BJF½ BJG;B^GV BqIqBqJx BqJ¾BhKb B^L%B^LJ B^M?C>M? ChM?C¨M! D{MBEcMQ FJMbG%Mb H¶MbIÄM( JcL±JcLJ JcL"JIK¨ J,KeI¥Ke'], BB: 68, CB: 592, HB: -48.5, DB: 783.5, AB: 624.5 }; C["É"] = D(C.E, "acute", 100, 240); C["È"] = D(C.E, "grave", 200, 240); C["Ê"] = D(C.E, "circumflex", 40, 240); C["Ë"] = D(C.E, "dieresis", 80, 240); C["F"] = { sC: ["I{KE IiKEITKM H[KzF·Kz FTKzE~Kq E&KhD;KS D9H- EwH`FUH` GlH`H¯HN IiHDIiGk IiG>ILFÄ I/F¨H¨F¨ HSF¨GnF° FªF¹FUF¹ EµF¹D6F^ D-A> D-@·C´@x Cw@ZCL@Z C!@ZB©@x Bk@·BkA> BkB¡BsE¢ BzH£BzJA BzJmByKB BwK¼BwLD BwLpB´L¯ C,M)CWM) CxM)C³L» D­M-EkM7 FKMBF·MB G§MBH¸LÄ JYLuJYL, JYK¨J@Kh J#KEI{KE"], BB: 84, CB: 587.5, HB: -52, DB: 768, AB: 606.5 }; C["G"] = { sC: ['K7E³ J{CfI9B1 Gx@¡Ep@¡ C¢@¡BªA§ A²B®A²Dº A²F·B©HÃ C¡K,E9LQ F6M@GBM@ G¾M@I,L¨ J_L?J_Kk J_KBJAK" J#J¦I|J¦ IfJ¦I>J¿ H)KxGBKx FzKxF)K* E¤J§E5IÃ CTGvCTDº CTCaC°B¹ DJBFEpBF FÁBFGÂC5 I&D*I]E§ GNEwE¯D¾ EwD³EaD³ E5D³D¼E2 D¢EPD¢Ey D¢F.E3FN F©GOJ­GO K4GOKPG2 KnF¹KnFl KnF,K7E³'], BB: 38.5, CB: 661.5, HB: -34, DB: 767, AB: 679.5 }; C["H"] = { sC: ['LOKÄ LAKyLAK) LAJ¯LCJR LEI¼LEI} LEH½L4GY L!EºL!E5 L!DlL-CW L8BBL8Ax L8AOKÀA4 K¥@»KZ@» K3@»J»A4 J}AOJ}Ax J}BBJsCW JhDlJhE5 JhE~JmFF IEFCGOE· D5ED D5DmD"CK C´B)C´AP C´A(Cx@¯ C]@qC4@q B¯@qBr@¯ BVA(BVAP BVB8BhC¨ ByESByF: ByFqBuG] BqHIBqH£ BqIMB{Jh B§K¥B§LO B§LyBÂL· C:M/CcM/ C­M/D#L· D?LyD?LO D?K¤D5Jf D+IJD+H} D1F¨ GTGT IOG¦J{G§ J¨H³J¨K) J¨KuJÁL@ K>M(KyM( KÁM(L;L° LXLtLXLJ LXL;LOKÄ'], BB: 74, CB: 715, HB: -41, DB: 758.5, AB: 768 }; C["I"] = { sC: ['HiJ¥ H*J¥GKJ² F.K" EºHªEºF¨ EºF@E¾E] EÂDxEÂD3 EÂCWE»B¯ HLB³ HvB³H´Bt I,BVI,B, I,A¤H´Ae HvAGHLAG G¸AGG(AE F:ABE§AB ECABDCA0 CB@ÁB¤@Á BX@ÁB<A; AÃAXAÃA¥ AÃB,B<BI BXBhB¤Bh C@BhDSB| D^CJD^D0 D^DtDVET DPF5DPFy DPHYDlK+ CmK& BnK# BCK#B&KA A®K^A®K¬ A®LeBhLn C6LuD±Lu FQLuHwLJ IML>IMKc IMK4I+J¼ H±J¥HiJ¥'], BB: 36.5, CB: 517.5, HB: -18, DB: 729, AB: 546 }; C["J"] = { sC: ["JRK1 JAK1I¹K8 ImK@ITK@ I$K@HeK= HjJI HjDsG«B& GH@LF&@L D~@LCVAG AÀBPAÀC¤ AÀDzB£Dz CdDzCdC¦ CdC2DVBc EDA¸F&A¸ FxA¸F¹E¤ G$GjG$JI G$JeFÃK2 FeK1 F>K1EsK4 E$K6D¡K6 DSK6D6KQ C»KnC»K¿ C»L£DÃL£ EAL£E¦L~ FDL{FeL{ G!L{G¿L¥ HºL¬ITL¬ K3L¬K3K» K3KrJ¼KR J}K1JRK1"], BB: 45.5, CB: 632.5, HB: -59, DB: 739.5, AB: 665 }; C["K"] = { sC: ['J&@¼ H¶@¼F¤BÁ D^ED D^E6 D]A7 D]@VCª@V CO@VC.@ª BµA/BµA_ BµCBBÃF¬ C.JPC.L4 C.L_CJL| CfL¼C²L¼ D8L¼DTL| DqL_DqL4 DqKUDeI° DYHLDZGf E^HbF¥IÀ H½Lc I;L«IeL« I®L«J)Ll JHLMJHL" JHKdHLIL FÁG°EeFW FZE]HTCv I:BÂ IsBuJ2B` J¢BEJ¢A¡ J¢A^JlA? JQ@¼J&@¼'], BB: 104, CB: 606.5, HB: -54, DB: 747.5, AB: 610.5 }; C["L"] = { sC: ['I*Ak H<A6FP@° Dw@hCm@h B­@hB`@¨ B#A.B#A¾ B8D` BQGÁBQL? BQLjBnL© B¬M"C2M" C]M"CyL© C¶LjC¶L? C¶GºCzDS CmC> CfBnCgB/ EfB,HlC& H}C,H­C, I4C,IQB® IjBmIjBE IjAªI*Ak'], BB: 49, CB: 531.5, HB: -45.5, DB: 752.5, AB: 550.5 }; C["M"] = { sC: ['Mu@q M@@qLÀA& L£AVLjBC LFCl KÁD«KGHÀ I¦DP IJB¹ I&B(H£Ac HW@»Gµ@» GY@»G7AV G!A¢F³B> FuC+ E´E§EFH° E"G_ D$C[ CÀB£CuAN CW@¥B¶@¥ Be@¥BGA# B/ABB/Am B/B³BsD~ C_G© C¹J: DAKµDrLT D»L°ERL° E´L°F1LE FWKoF¦Ic G6FÄH#D+ I4G"IÁJ: J;KI JMKÂJjLS J²L¿KQL¿ L$L¿LQKz LbKBLxI¶ M1FZMªCÄ N7Bz N]AsN]AS N]A)N<@° M¿@qMu@q'], BB: 54.5, CB: 845, HB: -41, DB: 749, AB: 882.5 }; C["N"] = { sC: ["M!B½ M!BlL¶A¡ L¦@¾L*@¾ Kv@¾K*Ac GÀDZC½IÂ C¸HA CµFc CµE´C¹Dp C¼CMC¼B| C¼@uC4@u B¡@uB`@º BBA5BBA` BBA«BIB[ BOC.BOCW BOC¶BSD¯ BWE¨BWFA BWF¥BTG§ BQH©BQIG BQI§BEJ¡ B:KxB:L5 B:LcBaLª BªM,C8M, ClM,D8L; F+IOGnG^ ITE?KjC; KmCfKjD7 KgE2 KgH_KEJ] KAJwK*KC JºK¨JºL* JºL¿K¡L¿ M(L¿M(H! M(G5M$E_ M!CªM!B½"], BB: 60, CB: 755, HB: -39, DB: 757, AB: 796.5 }; C["Ñ"] = D(C.N, "tilde", 160, 160); C["O"] = { sC: ["GQ@© E=@©C¡B+ B3C[B3Eq B3HBC|JV E[L¬H)L¬ JkL¬K©Ky M)JcM)GÁ M)ELKsC< IÂ@©GQ@©"], hC: [["H)KA F9KAD¶IS C{GyC{Eq C{D4D©C= E®BNGQBN I>BNJXD= KcE¶KcGÁ KcIªJ{Jg I¹KAH)KA"]], BB: 56.5, CB: 755.5, HB: -30, DB: 739.5, AB: 798 }; C["P"] = { sC: ['DUE¢ D9E¢C_E® CVDyCVAª CVAaC<AE C"A*B~A* BVA*B=AE B"AaB"Aª B"D% B"E5B5G: BHITBJJO BJKU BJL6BVLc BmM8C6M, CUM6C²M; DHM@D¿M@ FOM@GlLF HºK?HºI¤ HºG²G`F£ F;E¢DUE¢'], hC: [["D©K© D[K©D9K§ CºK¥C£K¡ C¡JK CjGF DUG9 EzG9FjG¯ GeHhGeI¤ GeJpFpK> E¦K©D©K©"]], BB: 48.5, CB: 490.5, HB: -12, DB: 767, AB: 520.5 }; C["Q"] = { sC: ["M¬=¹ M_=¹KÄ?= J8@¶ H¶@PGr@P EK@PCmB; A°D$A°FM A°I)C³JÀ E±L¬HjL¬ KVL¬L¶Jy N3H°N3E¼ N3CVKxAz MK@5 NI?I No?%No>~ No>UNQ>6 N3=¹M¬=¹"], hC: [['HjK? F^K?D¿I¯ CUHUCUFM CUDxD{CJ EÃA½GrA½ H4A½H}B+ G?COG?D. G?DYG`Dv G¢D´H%D´ HUD´HzDc IYCfJSB¤ LkD"LkE¼ LkH;KuIq JnK?HjK?']], BB: 37.5, CB: 854, HB: -214, DB: 739.5, AB: 876 }; C["R"] = { sC: ["I°A7 IiA7IHAV F¨C¸CzD§ C¤CD C©A§ C©AYCkA< CN@ÂC#@Â B{@ÂB_A< BBAYBBA§ BBBQB;Ck B4D¦B4EP B4F*BGG[ B[H°B[Ig B[I»BRJ{ BHK[BHK° BHLEBiLp B°M!CNLÀ E9L® F?L{F¾LJ J%JyJ%HI J%G4HÃFB H3EgF´E6 IAC¶JWB` JrB?JrA¿ JrAtJSAU J5A7I°A7"], hC: [['DÂKB C²KM C»JW CÂI²CÂIb CÂH¶CµGÂ C¡F] C¯F]D(F] DEF[DTF[ FMF[GIFÀ G£G;H.Gm HcH"HcHI HcIQGHJF F:K1DÂKB']], BB: 57, CB: 599.5, HB: -17.5, DB: 749.5, AB: 628 }; C["S"] = { sC: ['BDC5 BCC_BaCy B~C´C&C´ CWC´C|C[ D-B´DTBw E&B?FEB? G]B?H_B¤ I§CUI§Dk I§EfHzF- G¦FkFUFp E:FvDNG2 CCG¥CCH¸ CCJCD¬KR FELZG±LZ HnLZIeL: J¥K³J¥KN J¥JzJ*Jz I¦JzI!J± H@K"G­K! FsJÃE«JV D½I®D½HÃ D½HOF+H- FaGÄG|G¹ IZG¨JXF¬ KLE»KLDv KLB°IvA¥ H:@­FD@­ D´@­C~AN BGB!BDC5'], BB: 65, CB: 645, HB: -28, DB: 716, AB: 693 }; C["T"] = { sC: ['KuJ¶ K+J¶I¸JÂ H¥K)H6K( GrK( GuJ!G®Gt GÄEYGÄD< GÄC½H(CU H.B³H.Bm H.B*G¼A{ G¡A:GDA: FÀA:F¡AU F_AqF_A¾ F_B*FdBG FiBfFiBt FiC"FcC¦ F]DcF]D¶ F]EÂFEG¿ F.J-F+K# ERK" C}K"B¥KC B3KWB3L" B3LKBLLk BjL¯BºL¬ C:LªD4Lx D¸LmERLm E¯LmF§Lo G|LrH5Lr H£LrI·Lg K(L[KuL[ KÁL[L:L> LVKÄLVKx LVKML:K0 KÁJ¶KuJ¶'], BB: 56.5, CB: 714, HB: -4, DB: 739.5, AB: 679.5 }; C["U"] = { sC: ["GE@½ D¸@½C£BI BªCVBiEj BYFfBYIX BYJbB`K5 BfK±BqL1 B¬LyCHLy D!LyD!KS D!F¹ D!BFG@BF JFBFJFJ* JFJPJFJ­ JEKEJEKX JEK¸JZLC JwL~K+L~ K°L~K°Kx K°KOK±J¡ K±J-K±I¨ K±@½GE@½"], BB: 75.5, CB: 678, HB: -20, DB: 733.5, AB: 736.5 }; C["V"] = { sC: ['K=K} J£K!JZJ> I³Hi G¬C! G[B$FÁA. F¢@tFF@t E|@tE^A@ DgCiCVG¹ B¬J" BOKoBOL, BOLXBoLu B®L²C3L² C~L²CµL? D7J¸ D·HI EsE_FKCW FQCg HVI+ I)J¾ IbL+IÃLv J@LÀJmLÀ J¶LÀK2L¢ KPLbKPL7 KPK½K=K}'], BB: 70.5, CB: 647, HB: -39.5, DB: 749.5, AB: 649.5 }; C["W"] = { sC: ['L/@e K¥@eKa@~ K9@½K9AE J¯B<J£B© JvCPJ3F+ I¤H1IrIQ H½F±H6E/ GCC,FÄA¼ G-A¦G-An G-ABF©A$ Fc@®F5@® E2@®E2A¤ D¶B~ D)F] CjHNBPKµ BIL&BIL9 BIL·C0L· CpL·C´LN D"L+DYJ§ DµISELGZ F+D+ F¶EÀG|Hz H:JMH[JÂ I3LwI©Lw JKLwJhL1 J­K^K.HÄ KBG¤KrEÃ LEBÃ MGE[N¯It NºI³O=K+ OYKÁO¥L^ P$L¶P_L¶ Q@L¶Q@L1 Q@KÃPÄKO P{Jg PDI8 N!Cx M{B¦L¼A$ Lv@eL/@e'], BB: 67.5, CB: 1023, HB: -47, DB: 745, AB: 1039.5 }; C["X"] = { sC: ['K§Kh J¤JIJ;Ic IAH. H{GIH;F§ IµDI JµB²KwA» K³AyK³AU K³A,Ks@± KT@pK+@p J©@pJg@± IÁARIPBG HMC³ G3Em DdBi C0@Á B³@¡Bi@¡ B@@¡B!@¿ A§A;A§Ae A§AªAÀB% CMCk F;F¶ EPH"DWI3 CfJM BÄK(BhKY B>K|B>L( B>LPBZLq BwL²BÃL² CtL²DuK_ D¿K"EoJ5 F^I0GBH+ HÄJb J{L²K:L² KcL²K£Lr KÂLRKÂL) KÂKªK§Kh'], BB: 33, CB: 686.5, HB: -41.5, DB: 742.5, AB: 723.5 }; C["Y"] = { sC: ['J:K" J"J~I}J0 HTF´ GsE(F¿Cz F!AÂ EoA6 EN@~Dº@~ Dr@~DR@¼ D3A6D3Aa D3A¤D±C0 EªD¯ DXFnD#Gp CyH^BµIy A¨KKAmKx A_K´A_L+ A_LUA~Ls A¾L²BBL² BsL²BµLb CbKi DHJODjIº E3HÂE]H8 E}GhFfF[ HEJ| HlK?I.LK IJL±I¬L± J0L±JOLt JoLWJoL, JoK¢J:K"'], BB: 14, CB: 598, HB: -34.5, DB: 742.5, AB: 635 }; C["Z"] = { sC: ["J¹Jª IµJ- HaI#F£Fv D)B¥ C³B^CzB> FvBL HoBXIsBX JtBXK0BL K¢B=K¥A} K§ALKdA0 KF@»J½@» J~@»JE@¾ I¯@ÁIq@Á H[@ÁF2@º C¬@³Bu@³ A§@³A§As A§B3B@B· C)D% E¬G³ GdJ0HÂKO FIK< C>K< C4K<BÂK: B­K9B£K9 A»K9A»KÁ A»LaBMLv BnL¦C8L¦ C|L¦D£Lv E©LhFILh F·LhH*Lr I@L{I¯L{ KªL{KªK¿ KªK[J¹Jª"], BB: 33, CB: 674.5, HB: -25, DB: 736.5, AB: 693 }; C["0"] = { sC: ['E¹@¾ Cn@¾BfC+ A~D}A~GK A~IgB§K9 D"M0F4M0 H5M0IEKU JAI»JAGª JADRI6Bx H,@¾E¹@¾'], hC: [["F3Ku D¡KuC¶J; C;HÄC;GZ C;D¼C´Cy DiBWE¹BW GfBWH?DC H¡EhH¡Gd H¡ImH+Jq GYKuF3Ku"]], BB: 29.5, CB: 575.5, HB: -19.5, DB: 759, AB: 610 }; C["1"] = { sC: ['FrAA E/AA CnAB C)ABB±AJ B]A]B]A¸ B]BxCvBx D#Bw DLBu DLC"DDC¢ D;D[D;D¬ D;E¨DRG¥ DhI|DgJ| CeI¹C?I¹ B»I¹B}J3 B`JPB`Jx B`K#C3Kg ChK®DHL^ DÁM4EmM4 F.M4F.Lj F.LRF(L% F!KzF!Kd F!KCF$J¤ F)J@F)IÃ F)I0E´GT E{ExE{D¬ E{DPE¥C¢ E¬C.E­B{ FrB} F½B}G5Bb GPBFGPAÁ GPAvG5A[ F½AAFrAA'], BB: 77, CB: 391, HB: -.5, DB: 761, AB: 450 }; C["2"] = { sC: ["H½A@ H¤A@HUAO H)A_G´A_ G`A_F}AX E»AREfAR E?ARDvAH D*A?C§A? CzA?CfAB CPAFCEAF B¥AFBnA« BcB*BcB~ BcDbC_El C¹F+E²GV F¾H5GJHl GÁIIGÁJG GÁJ¨GMK6 F©KcFAKc EhKcD¹K. C®JA CbIÃCGIÃ BdIÃBdJq BdJÁB«K? C{L*DNLZ EDLÀFALÀ G`LÀH[LH IgKhIgJP IgImIJH» I-HDHuG¢ H+G&F}F: EDEGD®D¯ CÁC¾CÃB| EjB± G8B¼G´B¼ H[B¼HÁB£ IwB_IwAÄ IwA|I[A^ IAA@H½A@"], BB: 80, CB: 538, HB: -1.5, DB: 749.5, AB: 610 }; C["3"] = { sC: ['E³@¸ D~@¸C«AR B§A¼BVB½ BPC,BPC< BPCeBoC~ B¯CºC3Cº CZCºCwCt D"C0 DFB£D¥Bi E=BPE³BP F|BPGKBµ GÃCYGÃD> GÃERG3F* FTFwE5F© DIF´DIG_ DIG»DÁH6 FªHq GKH«GnI2 G²I[G³Iº GµJnGNK! F©KXE©KX ECKXD¨K8 C¹Jt CwJ_CdJ_ C;J_BÃJ} B§J½B§K@ B§K°C¼LT D¾L·EpL· GAL·H<L7 I@KSI@I¾ I@H5G©Gm GwGfGaG_ HcG/I"FO IdEqIdDc IdBÄH[A¾ GT@¸E³@¸'], BB: 71, CB: 528.5, HB: -22.5, DB: 745, AB: 610 }; C["4"] = { sC: ["HpDm HpA¦ HpA(G¹A( G/A(G/B6 G/BGG0Bi G2B«G2B¶ G1Dr C¦D} B~D}BID¨ AqD¶AqEJ AqEwB%F9 B{FÀ F[LZ F¿M5G¤M5 HpM5HpLU HpF* H£F+HºF+ JKF+JKEJ JKD§I£Dr I`DiHpDm"], hC: [["G1F. G1K% E-G©C½F7 G1F."]], BB: 23, CB: 580.5, HB: -13, DB: 761.5, AB: 610 }; C["5"] = { sC: ["Eg@§ CQ@§BNBQ B=BnB=B« B=C.B[CJ BzCfBÂCf CGCfClC; CÂB}D9Bk DzB?EgB? F²B?G¢C@ HjD;HjEi HjFxH:GP G¡H@F£H@ EºH@EUH# DÃG°DkGW C£Fc CUF6C(F6 B¤F6BgFR BJFoBJF¸ BJG)BZHC B|JxB|KW B|KzBkL! BYLJBYL_ BYL½C?L½ CSL½C{L¹ D!L¶D6L¶ DoL¶E`Lº FQL¾F¬L¾ G#L¾GYL¼ G²LºH*Lº H<LºH`LÁ H¥M$H·M$ I:M$IWL¬ IvLnIvLH IvKZG°KZ GpKZGAK] F¶K_F¬K_ EeK[ D?KV D?K*C¾H´ DÄI}F£I} HVI}IHHT J&GEJ&Ei J&CbH°B6 Gn@§Eg@§"], BB: 61.5, CB: 562.5, HB: -31, DB: 753.5, AB: 610 }; C["6"] = { sC: ["E¬@| C­@|BµB6 B.COB.EO B.I1E5K· E´Lr FUM1FxM1 FÁM1G;L¸ GYLzGYLS G[L0FwKL E/I¬ DaI9D&Gº D}H>E;HQ E|HeF#He G«HeH¥Gk I~FqI~D´ I~C(HzA¸ Gp@|E¬@|"], hC: [["E¬FÀ E5FÀDsF£ DYFuCsF4 CmE¤CmEO CmCÃD&C2 DrB$E±B$ G!B$GtB² H>CqH>D´ H>EºGrFZ G#FÀE¬FÀ"]], BB: 54, CB: 541.5, HB: -35.5, DB: 759.5, AB: 610 }; C["7"] = { sC: ['J(K= IPJU HQIAGgGo F4Di F!D=EcBª E0AwD§A/ Di@¤D6@¤ C²@¤Cr@¿ CSA8CSA_ CSA¦C´B¿ EnG6 F¢IwG»K" H+K7 D@KA BfKG A©KOA©L# A©LMAÄLi B=L¥BgL¥ CbL¥EWL{ GNLtHILt I}Lt JdLtJdL5 JdKªJ(K='], BB: 34, CB: 592.5, HB: -32.5, DB: 736, AB: 610 }; C["8"] = { sC: ['E¼@° DK@°CLAh B<BLB9C³ B5FLC¹G> BiH(BiIk BiK"CoKÀ DoLµF$L· I?L»I?I¡ I?H¬H³HJ HkG¸G~G^ H±F·IIF? I°E]I°D- I°BgH{Au Gr@°E¼@°'], hC: [["E³F| DvF2DAE¡ CqE-CvC¼ CzBÂDfBd E5B8E¼B8 GEB8G¬B¬ H@CIH@DL H@ELG]E½ F½FPE³F|", 'F!Kf E#KfDcJÁ D%J[D&Ik D(HbE«H( F~HJG/Hm G¤I"G¤I¡ G¤J¦GEK9 FµKfF!Kf']], BB: 59.5, CB: 549.5, HB: -26.5, DB: 745, AB: 610 }; C["9"] = { sC: ["G?B8 FyA¦E[A9 D,@fCh@f C?@fC%@¥ B¯@ÂB¯AF B¯A£CNAÀ DrBU E¬BµFaCd G8D3G¤EF H+E½ GuE|FÁEa FHEFEµEF DZEFCSF- B/G*B/H³ B/JÄCWL) DgLÀFPLÀ G¦LÀHµK® J(JqJ)H· J*F¿INE3 HkC7G?B8"], hC: [["F4Kx D³KxD>K! ClJMCkI! CkGµDOGC E(F¡F/F¡ F~F¡GRG- GzGBH_G° HlHcHlH· HkI±G§J¥ FÁKxF4Kx"]], BB: 54.5, CB: 563.5, HB: -46.5, DB: 749.5, AB: 610 }; C["¡"] = { sC: ["B7L­ B7M-BSMG BoMbBµMb C9MbCbM. C©L¡C©LV C©L3CkK½ CNK£C+K£ B¨K£B^L3 B7LdB7L­", "B9AX B9I¹ B9JoB³Jo CgJoCgI¹ CgIpCiHÂ CkHPCkH) CkF¾CiD£ CgBgCgAX Cg@¤B³@¤ B9@¤B9AX"], BB: 58.5, CB: 162, HB: -32.5, DB: 783.5, AB: 237.5 }; C["!"] = { sC: ["C©AX C©A5Ck@¾ CN@¤C+@¤ B§@¤B^A4 B7AeB7A¯ B7B/BSBH BoBcBµBc C9BcCbB/ C©A¢C©AX", "C¨L­ C¨DK C¨CuC.Cu BWCuBWDK BWDtBTEC BREµBRF9 BRGGBTIc BWK}BWL­ BWMbC.Mb C¨MbC¨L­"], BB: 58.5, CB: 162, HB: -32.5, DB: 783.5, AB: 237.5 }; C["|"] = { sC: ["DuNL EHNLEHMv EH?R EF>aDt>a D9>aD$?* C½?QC½AZ C½Mv C½M¾D4N4 DMNLDuNL"], BB: 172, CB: 259, HB: -177, DB: 837, AB: 421 }; C['"'] = { sC: ['FaLv FaLgF^LJ F[L-F[KÃ FRI# FPHLE|HL EVHLE<He E"H~E#I! E-L$ E/LtE9Lµ ENMLE¬ML F0MLFHM3 FaL¾FaLv', "CbI¦ CbItCfIS CkI3CkI# CkH£CPHi C6HPB´HP B3HPB3Ix B3J7B6K8 B9L9B9Lz B9LÂBQM8 BjMPB³MP C6MPCNM8 CgLÂCgLz CgL;CeK> CbJBCbI¦"], BB: 56.5, CB: 335, HB: 453, DB: 775, AB: 424 }; C["'"] = { sC: ['D¨LF D¨L(D­Kp D±K5D±J» D±I¾D7I¾ C{I¾CjJF CcJ]CcK" CcK>C]Ku CWL*CWLF CWM&C`MI CsMºD5Mº DZMºDtM¢ D¯MhD¯MB D¯M-D¬L§ D¨LZD¨LF'], BB: 138.5, CB: 230, HB: 556.5, DB: 810.5, AB: 388 }; C["#"] = { sC: ['BFEv D%Ev DÀH­ B»H­ B<H­B<Im B<J6CLJ6 ENJ6 EhK&E¾Ll F7MEF°ME G.MEGCM+ GXL´GXLs GXLJG>Kr F¶JUF¯J6 JgJ6 JªK,KALs KZMEKÃME LtMELtLy LtL6KÄJ6 MaJ6 NDJ6NDIn NDH©MUH© MGH©M(H« L¬H­L{H­ KmH­ J§Ev LKEv L¶EvM0Ek MdEWMdD¿ MdDBL±DB JSDB I}A¨ IbA%H±A% H>A%H>At H>B-H_B¾ H®D5H±DB E%DB D¬CPD?As D"A-CaA- BµA-BµA{ BµAÃC(Bi CJCVCmDB B2DB AbDBAbE" AbEIA¥Ea AÁEvBFEv'], hC: [["FWH­ E^Ev IEEv J3H­ FWH­"]], BB: 15.5, CB: 833, HB: -14, DB: 769.5, AB: 842.5 }; C["$"] = { sC: ['G.M¢ G.LZ G1LZ G²LZHªL: J$K³J$KN J$JzINJz I&JzHDJ± GcK"G.K! G.G· H¨G¤I¢F© JpE¸JpDv JpC1IhB0 HpA?G.@½ G.>º G.>rF¸>X F}>?FV>? E£>?E£>¸ E£@± B"@¸B"B¨ B"C^BuC^ C!C^CLC9 C®B¦D+Bs DzBKE£BE E£Fp EyFp DbFvCsG9 BjG°BjI" BjJ(CgJÂ DZK¯E£L> E£Mz E£MÂE½N9 F3NRFZNR G.NRG.M¢'], hC: [["G.FV G.BZ G¸B~HZCA I(C²I(Dk I(E·G.FV", "E£H# E£J¥ D=J9D=HÃ D=HAE£H#"]], BB: 48.5, CB: 598.5, HB: -193.5, DB: 840, AB: 693 }; C["%"] = { sC: ["J³A/ I®A/I3A¡ HWBQHWCV HWDgI)EE I¢F+J±F+ K¶F+LwEa MfD°MfC¯ MfBwL¨A¶ L$A/J³A/", 'JxL[ JRKÃJ)K@ IeJ! H"F¦ FHC6 F*BkEfAX EJA#D¿A# D}A#DcA; DHARDHAu DHA¦DNA¸ D¡B»EiDn FgFiF¯GB H·K¯ IIL±IvM> I¶M`J3M` JTM`JoMF J«M-J«L¯ J«LwJxL[', "DsI: CjI:B½I¼ BQJsBQK| BQL[C5M2 C·M¨DvM¨ E¦M¨FWM& G&LLG&K> G&JGFCI~ EkI:DsI:"], hC: [["J±Dª JHDªIÃDR I}CÄI}CV I}B·J%Bt JPBRK$BR KuBRK½B£ LAC/LAC¯ LADDK§Di KODªJ±Dª"], [], ['DsLb DELbCÁLD CuL"CuK| CuK-C·J© D4J_DsJ_ E&J_ERJw E¦J´E¦K> E¦K³E`L8 E:LbDsLb']], BB: 71.5, CB: 785.5, HB: -15, DB: 801.5, AB: 820 }; C["&"] = { sC: ['DºJ{ DºK[EiLG F?M9FÁM9 G°M9HMLl H«L"H«K1 H«IlFÀH: GiF¸H§D¾ H»EQI!E­ I1FoI8F© IRGWI©GW J/GWJGG+ JZF©JZFZ JZD¶IvCk J»AlJ»A; J»@»J}@¢ Ja@gJ=@g I´@gIs@» H¤BZ G=@½EJ@½ C¶@½BµA® A®B£A®D4 A®ErB½F¯ CnGgEIHz DºI~DºJ{'], hC: [["E¶GY DlFjD/F- C9E6C9D4 C9CIC±B© D^BHEJBH F²BHGÂCp GUD_E¶GY", "F^Ie GZJLGZK1 GZK_GKKu G<K­FÁK­ F¯K­FjKL FEJ±FEJ{ FEJ8F^Ie"]], BB: 36.5, CB: 619, HB: -46, DB: 763.5, AB: 654 }; C["("] = { sC: ['FjLª FjLfF-L" E£KxETKJ DhJOD*Hk CuG"CuEc CuAsEU?® E¥?iF0?E Fi>»Fi>m Fi>KFO>4 F5=¿E·=¿ Ex=¿EN>2 B1?½B1Ez B1G¥B¾I´ CµL?ETMG E|McE´Mc F4McFOMF FjM*FjLª'], BB: 55.5, CB: 339.5, HB: -211, DB: 784, AB: 366 }; C[")"] = { sC: ['FjEz Fj?½CK>2 C"=¿B©=¿ Bf=¿BK>4 B2>KB2>m B2>»Bk?E Bº?iCE?® E%AsE%Ec E%G"DqHk D2JOCFKJ B¼KxBnL" B1LfB1Lª B1M*BKMF BfMcB«Mc BÁMcCFMG D«L?E¢I´ FjG¥FjEz'], BB: 55.5, CB: 339.5, HB: -211, DB: 784, AB: 366 }; C["*"] = { sC: ["ApKF ApKkA¬K© B!L!BEL! B^L!DNKD DFLKDFL¢ DFM$D`M> DyMVDÀMV ECMVE]M> EvM$EvL¢ EvLJE|KZ GfK~G½K~ H>K~HVKd HoKJHoK# HoJaH$JP GaJBF3J- FmI{G/I) G¨H=G¨G¶ G¨GqGkGV GOG<G,G< F©G<FiG` F-H/E%IE C^GbB¸Gb BsGbBWG~ B=G»B=H; B=H]B]H} B½I0C´J$ CAJ>B&J{ ApJµApKF"], BB: 22.5, CB: 470, HB: 381, DB: 778, AB: 529.5 }; C["+"] = { sC: ["H=F5 H=E´H$Ew G°E]GjE] G^E]GFE` G/EdG!Ed F@Eb E¨E`E`Eb E`C} E`C#D«C# D^C#DGC: D1CPD1C} D0Dm D/E_ C9EWB«EW AqEWAqF1 AqFqB%F£ B9F¨B«F¨ C9F¨D/F® D.G¡ D.HVD7Hz D@H¿DUI- DjI?D­I? E/I?EII& EcH²EcHk EcHYE`H5 E]G´E]G¢ E^F² F%F¯ F9F¯FbF² F¬F´FÀF´ H=F´H=F5"], BB: 23, CB: 445.5, HB: 113, DB: 510.5, AB: 480 }; C[","] = { sC: ["CX>s C6>sB¿>¯ B¦?%B¦?H B¦?fC?@q CuAkC³AÀ D*BLDTBL DxBLD³B1 E)A¹E)Au E)A^CÁ?% C«>sCX>s"], BB: 96.5, CB: 243.5, HB: -168, DB: 69, AB: 276.5 }; C["-"] = { sC: ['FYD´ ETD§B£D§ B.D§B.EP B.E¿B£E¿ CME¿DhF" E¥F*FOF* G%F*G%E_ G%D½FYD´'], BB: 54, CB: 370, HB: 225, DB: 308, AB: 416.5 }; C["."] = { sC: ["CF@h B¶@hBq@­ BMA-BMAa BMAµBqB5 B¶BYCFBY CyBYC¿B5 D?AµD?Aa D?A-C¿@­ Cy@hCF@h"], BB: 69.5, CB: 190.5, HB: -45.5, DB: 75.5, AB: 249 }; C["/"] = { sC: ['Bo@k BJ@kB/@¥ A·@½A·A? A·ANA½Aa BhC2D9F= E¯IHFZJ¾ GYMyG¾Mv H?MuHZM] HwMCHwLÂ HwL¬HlLk G¡Ja G<I+FCG? DoD+ C=A" C"@kBo@k'], BB: 41, CB: 474, HB: -44, DB: 793.5, AB: 511.5 }; C[":"] = { sC: ['DEHh DEH;D)GÂ C±G¦CcG¦ C6G¦B¼GÂ B~H;B~Hh B~HtBzH® BuI"BuI/ BuIYBµIv C/I³CZI³ DEI³DEHh', "DVBÁ DVBsD9BV CÀB:CrB: CEB:C*BV B±BsB±BÁ B±C1BªCT B¤CyB¤C­ B¤D3BÃDN C>DjCiDj DVDjDVBÁ"], BB: 89, CB: 202, HB: 60, DB: 551, AB: 298.5 }; C[";"] = { sC: ["Bi?§ A´?§A´@a A´@ÂBfA¾ C;B¿CuB¿ CºB¿D3B¥ DNBiDNBD DNAÄC­AQ CC@~C>@W C5?§Bi?§", "DSHb DSH6D7G½ C½G¡CpG¡ CDG¡C(G½ B¯H6B¯Hb B¯HoBªH© B¥HÁB¥I) B¥ISBÃIp C=I®ChI® DSI®DSHb"], BB: 39.5, CB: 200.5, HB: -95, DB: 548.5, AB: 298.5 }; C["<"] = { sC: ["CfE¼ C¾ErDlDÀ EJD:EnC¿ E³C¡E³CZ E³C6EwB½ E]B¢E8B¢ DÀB¢D¥B¶ D[C0C[D6 BzD¿AÁE? ATE[ATE³ ATFAAºFb BsF°C`G£ DwHÁD¶I6 E0INEMIN EqINE®I3 F%H»F%Hu F%HSE¬H5 E+GRCfE¼"], BB: 9, CB: 306, HB: 94.5, DB: 518, AB: 381 }; C["="] = { sC: ['D6D¨ DwD¨ExD¥ FyD¢G8D¢ G²D¢G²D( G²CQG8CQ FyCQExCT DwCWD6CW C»CWC_CS C"COBªCO B-COB-D% B-DwB¤D~ CnD¨D6D¨', "C¡H´ GFH³ GÀH³GÀH9 GÀGcGFGc C~Gd CgGdC:Gb B±G_ByG_ BRG_B:Gy B!G´B!H6 B!H~BuH¯ B­H´C¡H´"], BB: 48, CB: 429.5, HB: 134.5, DB: 487.5, AB: 510 }; C[">"] = { sC: ["F³FI F³F%FmE§ D§D,B¨B¬ BjBxBQBx B.BxA·B¶ A{C/A{CR A{CzAÃC¹ D¾F7 DDFrCDGi B(H}B(I4 B(IWBCIs B`I¯B¥I¯ C%I¯CCIl E!GsFWF· F³FxF³FI"], BB: 28, CB: 359, HB: 90.5, DB: 549, AB: 381 }; C["¿"] = { sC: ["FkLf F¸LfG8LH GZL+GZK¤ GZKEG:J· F¹J^F^J^ E£J^E£KP E£K©E¼L2 F8LfFkLf", "F4Ir F]IrF|IS F¼I4F¼H¯ F¼HJE¿Gh D3F6 C5EJC5Dq C5C¢CÂBÂ D©BBEzBB F6BBF¸B¤ GuC@G­C@ H2C@HOBÃ HmB£HmBX HmA®GWA? FQ@|Ez@| D5@|B·A· AuC-AuDq AuE¢BPFn BªG/C¿G½ E1H¨ElII E°IrF4Ir"], BB: 25, CB: 469, HB: -35.5, DB: 721.5, AB: 523.5 }; C["?"] = { sC: ["Cw@| CK@|C(@» B©A5B©A_ B©A½C%BK CJB¥C¦B¥ DbB¥DbA² DbAYDGA. D(@|Cw@|", "D,Co C§CoCfC° CGD,CGDS CGD¹DDEz F.G) G,G¸G,Hp G,IaFAJ@ E[JÀDhJÀ D*JÀCKJ_ BmIÂBVIÂ B.IÂA´J? AuJ`AuJª AuKTB­KÃ C²LfDhLf F,LfGLKL HmJ2HmHp HmGaG³Fs GYF0FEEF E0DZDvC¹ DSCoD,Co"], BB: 25, CB: 469, HB: -35.5, DB: 721.5, AB: 523.5 }; C["@"] = { sC: ['K=DT JUDTI­Ds I?D³H´EL H]D»H*D¡ GyDdGHDd F]DdE|E< D¾E·D¾F¡ D¾H2F)IH G7J^HmJ^ H¸J^I0J? ILIÄILIw ILI;HkHÂ GiH{G2HJ FdG§FdF¡ FdFbF¡FG F¿F*GIF, GÁF0HgGJ I(HQIZHQ I¦HQIÀH2 J6G·J6Gi J6GUJ0G. J)F©J)Ft J)F3JaF" JwE¿K=E¿ LCE¿LyF^ M)F»M)GÃ M)I²KjK% J9L1HEL1 F)L1D«JZ CwH¾CwFz CwDnDÄC6 FSAwHkAw I9AwIÀA¸ KHBT KtBeK¢Be L&BeLEBD LcB#LcA{ Lc@ÀJµ@e Iv@9Hm@9 Gc@9FR@o EBA"D]A} B-C¥B-Fz B-IqC}Km EXMzHEMz J²MzL{L3 NrJbNrGÃ NrFDM©EN L¹DTK=DT'], BB: 53.5, CB: 855.5, HB: -68.5, DB: 795.5, AB: 931 }; C["["] = { sC: ["Dp>/ DZ>/D.>- C¥>*Cl>* Bn>*Bn>À Bn@OB}DL B­HHB­I| B{L! BzL0 BxLUB³Ls C)L±CPL± CnL±D(L® DdL¬D¤L¬ D¶L¬E8L® E^L±EpL± FIL±FIL/ FIKXExKP E$KID1KM D7JwD7Iª D*Dy C½?k Dp?n D¯?nEE?k E¡?iE½?i FA?iFX?L Fp?0Fp>¬ Fp>cFX>F FA>*E½>* E¡>*EE>- D¯>/Dp>/"], BB: 85.5, CB: 342.5, HB: -204, DB: 742, AB: 376 }; C["]"] = { sC: ["Dn>/ D§>/E0>- E]>*Er>* Fp>*Fp>À Fp@OFbDL FSHHFSI| FcL! FdL0 FfLUFLLs F3L±E°L± EpL±E4L® DzL¬D]L¬ DIL¬D#L® C£L±CnL± B¶L±B¶L/ B¶KXCfKP D8KIE-KM E%JwE%Iª E3Dy EB?k Dn?n DQ?nC»?k C`?iCB?i B¿?iB¨?L Bn?0Bn>¬ Bn>cB¨>F B¿>*CB>* C`>*C»>- DQ>/Dn>/"], BB: 85.5, CB: 342.5, HB: -204, DB: 742, AB: 376 }; C["{"] = { sC: ['C>Er CuE®CÁFY DFG!DFG] DFG©D@I# D9JAD9Jl D9L+EBL: EdL;F$LD FkLSFkL« FkM;F2MZ E¦MuELMu D±MuDKMX B¬L¦B¬JO B±H¯ B´GJ B´G/ BaFÄAºF^ AGE¶AGEa AGE5B#Dt B£D1B£Cb B£CFByB´ BqB[BqB@ Bq@·CA?¡ D">KE@>K E¬>KF&>V FY>lFY?( FY?jF&?z E³?¤E@?¤ D~?¤DM@¨ D&AoD&B@ D&BbD/BÄ D7CcD7C¥ D7D0C®D£ CfEEC>Er'], BB: 2.5, CB: 340, HB: -187.5, DB: 793, AB: 366 }; C["}"] = { sC: ['DtEr D=E®C¶FY ClG!ClG] ClG©CsI# CyJACyJl CyL+BpL: BNL;A°LD AGLSAGL« AGM;A£MZ B/MuBgMu C"MuCgMX E)L¦E)JO E#H¯ DÄGJ DÄG/ ERFÄE½F^ FkE¶FkEa FkE5E°Dt E1D1E1Cb E1CFE9B´ EAB[EAB@ EA@·Dq?¡ C²>KBr>K B)>KA®>V AY>lAY?( AY?jA®?z AÄ?¤Br?¤ C5?¤Cf@¨ C®AoC®B@ C®BbC¦BÄ C|CcC|C¥ C|D0D&D£ DLEEDtEr'], BB: 2.5, CB: 340, HB: -187.5, DB: 793, AB: 366 }; C["^"] = { sC: ["E©M¬ F;M¬F©MG FÁM2GsLZ H¯K4 I&JºI&Jz I&JTH®J: HqIÂHMIÂ H,IÂG²J; GAJ¶E½L9 D!I¬C]I¬ C9I¬BÁJ$ B¦J@B¦Jd B¦J¨BÄK! CWKVEJMl EeM¬E©M¬"], BB: 96.5, CB: 498.5, HB: 547.5, DB: 803.5, AB: 581 }; C["_"] = { sC: ['KM>r Hy>r H2>rG(>v EÀ>{EX>{ B$>{ A²>{Ac>v A5>r@Â>r @Â@$ A¤@$CD@& D«@(Ej@( F/@(G8@" HA?ÀH©?À KM@$ KM>r'], BB: -17.5, CB: 645.5, HB: -168.5, DB: -77, AB: 626.5 }; C[" "] = { sC: [], BB: 1e4, CB: -1e4, HB: 1e4, DB: -1e4, AB: 298.5 }; C[" "] = { sC: [], BB: 1e4, CB: -1e4, HB: 1e4, DB: -1e4, AB: 298.5 }; return C; function D(B, C, H, D) { var A = { BB: B.BB, CB: B.CB, HB: B.HB, DB: B.DB, AB: B.AB }, I = B.sC.map(B => B), x = typeof B.hC === "object" ? B.hC.map(B => B) : undefined, i = C === "dieresis" ? 2 : 1, L = C === "ring" ? 1 : 0; if (i === 2) { if (x) { x.unshift([]) } if (C === "dieresis") { I.unshift(e(H, D)) } } if (L) { if (typeof x !== "object") { x = B.sC.map(B => []) } if (C === "ring") { x.unshift(d(H, D)) } } else { if (x) { x.unshift([]) } } if (C === "dieresis") { A.DB = s(D); I.unshift(t(H, D)) } if (C === "circumflex") { A.DB = n(D); I.unshift(J(H, D)) } if (C === "acute") { A.DB = F(D); I.unshift(G(H, D)) } if (C === "grave") { A.DB = M(D); I.unshift(E(H, D)) } if (C === "tilde") { A.DB = h(D); I.unshift(u(H, D)) } if (C === "ring") { A.DB = o(D); I.unshift(c(H, D)) } A.sC = I; if (x) { A.hC = x } return A } function A(B, C) { return [[148 + B, 579.5 + C], [130.5 + B, 579.5 + C, 117 + B, 593 + C], [104 + B, 606.5 + C, 104 + B, 624.5 + C], [104 + B, 641 + C, 119 + B, 656 + C], [140 + B, 676.5 + C, 183 + B, 733.5 + C], [215 + B, 775.5 + C, 254.5 + B, 803.5 + C], [268 + B, 812.5 + C, 280.5 + B, 812.5 + C], [298 + B, 812.5 + C, 311.5 + B, 799 + C], [324.5 + B, 785 + C, 324.5 + B, 767.5 + C], [324.5 + B, 748 + C, 306 + B, 733 + C], [271.5 + B, 706 + C, 240 + B, 662.5 + C], [207 + B, 616.5 + C, 177 + B, 591.5 + C], [163.5 + B, 579.5 + C, 148 + B, 579.5 + C]] } function G(C, H) { return B(A(C, H)) } function F(B) { return 812 + B } function I(B, C) { return [[281.5 + B, 618.5 + C], [281.5 + B, 601 + C, 267.5 + B, 588 + C], [253.5 + B, 575 + C, 236 + B, 575 + C], [215 + B, 575 + C, 201 + B, 595.5 + C], [152 + B, 668 + C], [126 + B, 704 + C, 91.5 + B, 730.5 + C], [72.5 + B, 745.5 + C, 72.5 + B, 765.5 + C], [72.5 + B, 783 + C, 85.5 + B, 797 + C], [98.5 + B, 811 + C, 116 + B, 811 + C], [146 + B, 811 + C, 214.5 + B, 729.5 + C], [281.5 + B, 649.5 + C, 281.5 + B, 618.5 + C]] } function E(C, H) { return B(I(C, H)) } function M(B) { return 811 + B } function x(B, C) { return [[288 + B, 825 + C], [314.5 + B, 825 + C, 352.5 + B, 792 + C], [364 + B, 782 + C, 405.5 + B, 737.5 + C], [483 + B, 654.5 + C], [496 + B, 640 + C, 496 + B, 625 + C], [496 + B, 607 + C, 482.5 + B, 593.5 + C], [469 + B, 580.5 + C, 451 + B, 580.5 + C], [435 + B, 580.5 + C, 420 + B, 594.5 + C], [381 + B, 638.5 + C, 298 + B, 721.5 + C], [174 + B, 569 + C, 139 + B, 569 + C], [121.5 + B, 569 + C, 108 + B, 583 + C], [94.5 + B, 596.5 + C, 94.5 + B, 614 + C], [94.5 + B, 631 + C, 109 + B, 645.5 + C], [136.5 + B, 672 + C, 258 + B, 810 + C], [271 + B, 825 + C, 288 + B, 825 + C]] } function J(C, H) { return B(x(C, H)) } function n(B) { return 825 + B } function i(B, C) { return [[284 + B, 731 + C], [176 + B, 588 + C], [65 + B, 588 + C], [-42 + B, 731 + C], [50 + B, 731 + C], [120 + B, 642 + C], [191 + B, 731 + C]] } function L(C, H) { return B(i(C, H)) } function K(B) { return 731 + B } function a(B, C) { return [[162 + B, 669.5 + C], [226 + B, 669.5 + C, 226 + B, 618.5 + C], [226 + B, 604 + C, 204.5 + B, 590 + C], [185 + B, 578 + C, 167.5 + B, 578 + C], [107.5 + B, 578 + C, 107.5 + B, 628 + C], [107.5 + B, 642.5 + C, 126 + B, 656 + C], [144.5 + B, 669.5 + C, 162 + B, 669.5 + C]] } function t(C, H) { return B(a(C, H)) } function y(B, C) { return [[425 + B, 673.5 + C], [441.5 + B, 673.5 + C, 458.5 + B, 658 + C], [476 + B, 643 + C, 476 + B, 628 + C], [476 + B, 583 + C, 406 + B, 583 + C], [386 + B, 583 + C, 370.5 + B, 593.5 + C], [353 + B, 605 + C, 353 + B, 624.5 + C], [353 + B, 658 + C, 375 + B, 667.5 + C], [387 + B, 673.5 + C, 425 + B, 673.5 + C]] } function e(C, H) { return B(y(C, H)) } function s(B) { return 707 + B } function r(B, C) { return [[221.5 + B, 758.5 + C], [270.5 + B, 758.5 + C, 300 + B, 730 + C], [340.5 + B, 678.5 + C], [363.5 + B, 650 + C, 395.5 + B, 650 + C], [423 + B, 650 + C, 437 + B, 668 + C], [459 + B, 711 + C], [469 + B, 740 + C], [476 + B, 754 + C, 498.5 + B, 754 + C], [535 + B, 754 + C, 535 + B, 718 + C], [535 + B, 700.5 + C, 514 + B, 659 + C], [494.5 + B, 620 + C, 480 + B, 605 + C], [453 + B, 577.5 + C, 410.5 + B, 577.5 + C], [346.5 + B, 577.5 + C, 310.5 + B, 605 + C], [297 + B, 615.5 + C, 267.5 + B, 657.5 + C], [247 + B, 685.5 + C, 221.5 + B, 685.5 + C], [206.5 + B, 685.5 + C, 194.5 + B, 679.5 + C], [182.5 + B, 674 + C, 173.5 + B, 663 + C], [152 + B, 621.5 + C], [140 + B, 599.5 + C, 120.5 + B, 599.5 + C], [105 + B, 599.5 + C, 94 + B, 609.5 + C], [83 + B, 619.5 + C, 83 + B, 634.5 + C], [83 + B, 640 + C, 84 + B, 645.5 + C], [98 + B, 695.5 + C, 133.5 + B, 726.5 + C], [171.5 + B, 758.5 + C, 221.5 + B, 758.5 + C]] } function u(C, H) { return B(r(C, H)) } function h(B) { return 714 + B } function w(B, C) { return [[[290 + B, 650.5 + C], [332 + B, 652 + C, 351.5 + B, 662.5 + C], [384 + B, 680 + C, 384 + B, 727 + C], [384 + B, 755 + C, 357.5 + B, 771 + C], [335.5 + B, 785.5 + C, 305.5 + B, 785.5 + C], [199.5 + B, 785.5 + C, 201.5 + B, 707.5 + C], [202 + B, 685 + C, 231 + B, 667 + C], [260.5 + B, 649.5 + C, 290 + B, 650.5 + C]]] } function d(C, H) { return [B(w(C, H)[0])] } function f(B, C) { return [[128 + B, 707.5 + C], [128 + B, 778 + C, 178.5 + B, 819 + C], [227 + B, 858 + C, 305.5 + B, 858 + C], [366.5 + B, 858 + C, 410 + B, 824 + C], [457.5 + B, 786.5 + C, 457.5 + B, 727 + C], [457.5 + B, 654.5 + C, 413.5 + B, 617.5 + C], [370 + B, 580.5 + C, 282.5 + B, 579 + C], [216 + B, 578 + C, 172 + B, 616 + C], [128 + B, 653.5 + C, 128 + B, 707.5 + C]] } function c(C, H) { return B(f(C, H)) } function o(B) { return 785 + B } function N() { return [[183, 221.5], [183, 192, 184.5, 134], [186.5, 75.5, 186.5, 46], [186.5, 24.5, 173, 11], [160, -2.5, 138.5, -2.5], [117.5, -2.5, 104, 11], [90.5, 24.5, 90.5, 46], [90.5, 75.5, 89, 134], [87, 192, 87, 221.5], [87, 267.5, 92, 336], [97, 404.5, 97, 450.5], [97, 472.5, 110.5, 486], [124, 499.5, 145, 499.5], [166, 499.5, 179, 486], [192.5, 472.5, 192.5, 450.5], [192.5, 404.5, 187.5, 336], [183, 267.5, 183, 221.5]] } function V() { return B(N()) } } }.apply(C, D), A !== undefined && (B.exports = A)) }, function (B, C, H) { var D, A; !(D = [], A = function () { return function (B) { var C = { reverseHoles: true, reverseShapes: false }, H = " "; C["a"] = { sC: ['F&E¸ CgE¸B9EWB9C= B9AÄB½ABCÀAB ESAB F`ABGaA`H2B" H2A¯ H2A@H^A4HzA4 HµA4I?A>I?A© I?FH I?GwH·HFGiHF E9HF CUHFB9G¾B9Fn B9F"BcE¸B~E¸ C8E¸CEF<CEFn CEG%CwG9EGG9 GZG9 GÄG9H2G(H2Fh H2E¸'], hC: [["H2D¬ H2C«G¸BNESBN CÀBN CyBNCEB|CEC4 CEDvC²D¬F&D¬"]], BB: 59.5, CB: 510.5, HB: -7, DB: 450, AB: 580 }; C["b"] = { sC: ['CbGe CbJP CbJ³CAK)B¹K) BpK)BTJ³BTJP BTA© BTA>B¤A4B½A4 CSA4CbA`CbA¯ CbB" D3AbE4ABFBAB F|AB I?ABJhA}JhCÀ JhEk JhG®I?HFF|HF FBHF E4HFD3H&CbGe'], hC: [['FBG9 F|G9 H¯G9IZG(IZEe IZD" IZBaH¯BNF|BN FBBN D"BNCbC`CbD¢ CbDª CbF)D"G9FBG9']], BB: 73, CB: 594.5, HB: -7, DB: 627.5, AB: 654 }; C["c"] = { sC: ['H:AB IwABI´B;I´C. I´CoIwC«IKC« I/C«H§CyH§C4 H§BgHtBNH,BN F&BN C²BNCEBcCED" CEEe CEG%C²G9F&G9 H,G9 HtG9H§G!H§FT H§E²I/E£IKE£ IgE£I´E®I´FX I´GKIwHFH:HF F&HF CbHFB9G®B9Ek B9CÀ B9A}CbABF&AB'], BB: 59.5, CB: 551.5, HB: 0, DB: 450, AB: 609 }; C["d"] = { sC: ['B9Ek B9CÀ B9A}CbABF$AB F^AB GmABHnAbI?B" I?A¯ I?A`IMA4I¨A4 IÂA4JLA>JLA© JLJQ JLJ}J>K)I¬K) IoK)I?JÃI?JQ I?HF E¸HF CbHFB9G®B9Ek'], hC: [['CED" CEEe CEG(C¶G9E¸G9 I?G9 I?D¤ I?C`H~BNF^BN F$BN C¶BNCEBaCED"']], BB: 59.5, CB: 581, HB: -7, DB: 627.5, AB: 654 }; C["e"] = { sC: ['JLEk JLG®I#HFF`HF F&HF CbHFB9G®B9Ek B9CÀ B9A}CbABF&AB HbAB IÀABJ8B;J8C. J8CoIÀC«IsC« IVC«I+CyI+C4 I+BgH½BNHTBN F&BN C²BNCEBcCED" CED¯ JLD¯'], hC: [["F`G9 H^G9I5G*I?E¼ CEE¼ CMG!C¶G9F&G9"]], BB: 59.5, CB: 581, HB: 0, DB: 450, AB: 635.5 }; C["f"] = { sC: ["E´I² F>I²FlIÀFlJQ FlJ}FPJ¿E´J¿ C´J¿BjJhB_HD B9H>AÄH+AÄGª AÄGaB7GKB_GC B_A« B_A@B¨A4BÃA4 CYA4CkA^CkA« CkG9 EeG9 F2G9F>GaF>G} F>H&F$HFEeHF CkHF CqI¢DFI²E´I²"], BB: 47.5, CB: 340.5, HB: -7, DB: 621, AB: 336.5 }; C["g"] = { sC: ['JL@+ JLG¥ JLHJIÂHTI¨HT IMHTI?H)I?G} I?Ge HnH&GmHFF^HF F$HF CbHFB9G®B9Ek B9CÀ B9A}CbABEÄAB I?AB I??¯ I??KI5?>Hz?> CÀ?> CW?>CE?UCE@" CE@aC*@xB¢@x Be@xB9@mB9?Â B9?,BT>1C²>1 H©>1 J$>1JL>¤JL@+'], hC: [['EÄBN C¶BNCEBaCED" CEEe CEG(C¶G9F$G9 F^G9 H~G9I?F)I?D¬ I?BN']], BB: 59.5, CB: 581, HB: -200.5, DB: 457, AB: 654 }; C["h"] = { sC: ['FBG9 F|G9 H¯G9IZG(IZEe IZA© IZAEI¢A4J"A4 JYA4JhA^JhA© JhEk JhG®I?HFF|HF FBHF E4HFD3H&CbGe CbJP CbJ³CAK)B¹K) BpK)BTJ³BTJP BTA© BTA>B¤A4B½A4 CKA4CbASCbA© CbD¤ CbF$D"G9FBG9'], BB: 73, CB: 594.5, HB: -7, DB: 627.5, AB: 663 }; C["i"] = { sC: ["B¹Iu CEIuC±I¾C±JW C±J¹CCK;B¹K; BcK;AÂJ·AÂJW AÂI¼BjIuB¹Iu", "BPGÀ BPAj BPA%Bz@ºB·@º CM@ºC^A@C^Aj C^GÀ C^HbC2HrB¹Hr B|HrBPHbBPGÀ"], BB: 46.5, CB: 166, HB: -21.5, DB: 636.5, AB: 212.5 }; C["j"] = { sC: ["CbAB CbG{ CbH)CSHTB¿HT BcHTBTH)BTG{ BTAB BT?¯A­?y@-?y ?}?y?S?j?S?4 ?S>¬?n>m@->m B5>mCb>¾CbAB", 'B½Iu CIIuC´I¾C´JW C´J¹CGK;B½K; BgK;B"J·B"JW B"I¼BnIuB½Iu'], BB: -119.5, CB: 167.5, HB: -171, DB: 636.5, AB: 216.5 }; C["k"] = { sC: ['HpAw HpA«HhB"HTB1 DnEC GCGU GaGkGcG¦GcG° GcH4G?HPFÁHP F¨HPFnH@F`H4 CbEi CbJU CbJ½C6K)B½K) B¢K)BTJ½BTJU BTA£ BTACB|A4B»A4 C:A4CbACCbA© CbDa C©D¨ GqAQ G¡AEG¶A6H,A6 HTA6HpAYHpAw'], BB: 73, CB: 470.5, HB: -7, DB: 627.5, AB: 484 }; C["l"] = { sC: ["DXAB E#ABE0AlE0A© E0B@D¬BNDXBN C´BNC£BcC£C( C£JQ C£J¡CsK)C:K) BÁK)BtJÁBtJQ BtCE BtA¸BÁABDJAB"], BB: 88.5, CB: 247, HB: 0, DB: 627.5, AB: 287 }; C["m"] = { sC: ["EQG9 F±G9GMG(GMEe GMA© GMAIGkA4GºA4 HPA4H^AYH^A© H^D¤ H^FNI=G9JYG9 K¶G9LMG*LMEe LMA© LMA>L{A4L·A4 M-A4MZA>MZA© MZEk MZG®LDHFJYHF I_HFHxG¶H0G; GoH0FhHFEQHF DaHFCÂH+C`Gk C`G{ C`H8C?HTB·HT BzHTBRHHBRG£ BRA© BRA>B¢A4B»A4 CIA4C`ASC`A© C`D¤ C`FPD7G9EQG9"], BB: 72, CB: 780, HB: -7, DB: 457, AB: 848.5 }; C["n"] = { sC: ["F@G9 FzG9 H­G9IXG(IXEe IXA© IXAEI~A4IÄA4 JWA4JfA^JfA© JfEk JfG®I=HFFzHF F@HF E2HFD1H&C`Ge C`G{ C`H8C?HTB·HT BzHTBRHHBRG£ BRA© BRA>B¢A4B»A4 CIA4C`ASC`A© C`D¤ C`F$CÄG9F@G9"], BB: 72, CB: 593.5, HB: -7, DB: 457, AB: 662 }; C["o"] = { sC: ["F`AB I#ABJLA}JLCÀ JLEk JLG®I#HFF`HF F&HF CbHFB9G®B9Ek B9CÀ B9A}CbABF&AB"], hC: [['F&BN C²BNCEBcCED" CEEe CEG%C²G9F&G9 F`G9 HrG9I?G(I?Ee I?D" I?BaHrBNF`BN']], BB: 59.5, CB: 581, HB: 0, DB: 450, AB: 640.5 }; C["p"] = { sC: ["JhCÀ JhEk JhG®I?HFF|HF FBHF E4HFD3H&CbGe CbG} CbH)CSHTB½HT B¤HTBTHJBTG¥ BT?6 BT>®Bc>_B¹>_ C2>_Cb>iCb?6 CbAB F¤AB I?ABJhA}JhCÀ"], hC: [['IZEe IZD" IZBaH¯BNF¤BN CbBN CbDª CbF)D"G9FBG9 F|G9 H¯G9IZG(IZEe']], BB: 73, CB: 594.5, HB: -178, DB: 457, AB: 654 }; C["q"] = { sC: ["B9CÀ B9A}CbABEÄAB I?AB I??6 I?>mIo>_I¬>_ J>>_JL>®JL?6 JLG¥ JLHJIÂHTI¨HT IkHTI?HHI?G} I?Ge HnH)GmHFF`HF F&HF CbHFB9G®B9Ek"], hC: [['CEEe CEG%C²G9F&G9 F`G9 H~G9I?F&I?Dª I?BN EÄBN C¶BNCEBaCED"']], BB: 59.5, CB: 581, HB: -178, DB: 457, AB: 654 }; C["r"] = { sC: ["E©G9 F`G9 F«G9G7GGG7G£ G7H+FÁHFF`HF E©HF D»HFD/H&C`Ge C`G{ C`H8C?HTB·HT BzHTBRHHBRG£ BRA© BRA>B¢A4B»A4 CIA4C`ASC`A© C`D¤ C`FJDBG9E©G9"], BB: 72, CB: 378.5, HB: -7, DB: 457, AB: 396 }; C["s"] = { sC: ['C±AB GKAB IMABI¶B)I¶CC I¶DHIXEUG¨EU D"EU CoEUCCE}CCFN CCFÁCgG9D"G9 H+G9 HrG9H¥G!H¥FT H¥E²I-E£IIE£ IeE£I²E®I²FX I²GKIuHFH8HF D¤HF BzHFB7GcB7FN B7E=B¤DHDFDH H&DH H`DHH©C²H©CC H©BnH`BNH&BN C¾BN CUBNCCBgCCC4 CCCqC(C«B~C« BRC«B7CoB7C. B7B;BRABC±AB'], BB: 58.5, CB: 552.5, HB: 0, DB: 450, AB: 610 }; C["t"] = { sC: ['CkD" CkG9 EeG9 F2G9F>GaF>G} F>H&F"HFEeHF CkHF CkI~ CkJ>CKJWBÃJW BzJWB_J>B_I~ B_HD B9H>AÄH+AÄGª AÄGaB7GIB_GC B_CÀ B_A¡C©ABE´AB F`ABFjAqFjA¯ FjB@F<BNE´BN D<BNCkBaCkD"'], BB: 47.5, CB: 339.5, HB: 0, DB: 586.5, AB: 364 }; C["u"] = { sC: ['FpBN F6BN D$BNCWBaCWD" CWG¥ CWHBC2HTB²HT BXHTBJH+BJG¥ BJCÀ BJA}CsABF6AB FpAB G¡ABH¢AbIQB" IQA± IQAMIqA4I¾A4 J6A4J^A@J^A« J^G¥ J^HJJ0HTIºHT IgHTIQH4IQG¥ IQDª IICmH¹BNFpBN'], BB: 68, CB: 589.5, HB: -7, DB: 457, AB: 662 }; C["v"] = { sC: ['DdAB EÀAB HµG° H½GÂH½H)H½H0 H½HdHxHrHWHr H:HrGÂHdG°H< EEBV B¬H: B¢HNBlHrB>Hr B"HrA}HdA}H. A}H)A}GÄA§G°'], BB: 29, CB: 492, HB: 0, DB: 471.5, AB: 520.5 }; C["w"] = { sC: ["MZG¡ McG¸McG¼McGÄ McHRMAH^LÂH^ L¥H^LhHRLUH& JNBF H@GÀ H2HBGÂHRGuHR GGHRG1H@G#GÀ D®BF B°H& B|HRBaH^BBH^ AÄH^A£HRA£GÄ A£G¼A£G¸A«G¡ D)AB E`AB GsFv IoAB K&AB"], BB: 31, CB: 784, HB: 0, DB: 461.5, AB: 814 }; C["x"] = { sC: ['I/Aj I/A¯H¿AÂH»B" FJD¦ H»Ge I-G£I/G´I/GÀ I/HBH­H[HlH[ HRH[H>HVH,HD EeE[ B½HD B°HRBtH[BZH[ B;H[A¸HBA¸GÀ A¸G´AºG£B-Ge D|D¦ B-B" B$A¾A¸A©A¸Aj A¸ACB=A,BZA, BtA,B®A4B½AC EeD- H,AC H:A6HRA,HlA, H«A,I/ACI/Aj'], BB: 41.5, CB: 502.5, HB: -11, DB: 460.5, AB: 544.5 }; C["y"] = { sC: ['J^@+ J^G¥ J^HJJ0HTIºHT IgHTIQH4IQG¥ IQDª IQCmH¹BNFpBN F6BN D$BNCWBaCWD" CWG¥ CWHBC2HTB²HT BXHTBJH+BJG¥ BJCÀ BJA}CsABF6AB FpAB G¡ABH¢AbIQB" IQ?¯ IQ?KIG?>H­?> D/?> Ci?>CW?UCW@" CW@aC;@xB´@x Bv@xBJ@mBJ?Â BJ?,Bg>1CÄ>1 H»>1 J6>1J^>¤J^@+'], BB: 68, CB: 589.5, HB: -200.5, DB: 457, AB: 663 }; C["z"] = { sC: ["C¡BN I;G/ I;HF C±HF BcHFB7GsB7F6 B7EkBaE^B|E^ C4E^CCE£CCF6 CCF½COG9C¾G9 G{G9 B7BR B7AB G°AB I9ABIeA¼IeCQ IeCÂI7D+HÁD+ HtD+HWC´HWCQ HWB|HRBNG¡BN"], BB: 58.5, CB: 529, HB: 0, DB: 450, AB: 580 }; C["A"] = { sC: ["FfJ¿ EEJ¿ AwA­ AsA¡AqAqAqAf AqA0B$A!B7A! BTA!BpA6B¢AY C©D3 H$D3 I+AY I5A@IQA!IuA! IªA!J:A0J:Af J:AqJ8A¡J4A­"], hC: [["D>E? E¶IQ GmE?"]], BB: 23, CB: 572, HB: -16, DB: 621, AB: 595.5 }; C["B"] = { sC: ["BgAº BgAmBtABC(AB FRAB H¹ABJ>A}J>D) J>DN J>E§I¢F]HÁF¯ ITG?ImG®ImHb ImJ`H>J¿EºJ¿ C(J¿ B°J¿BgJ³BgJF"], hC: [['FvF" HbF"I1E²I1DH I1D) I1BeHbBNFRBN CsBN CsF"', "EºG/ CsG/ CsI¨ EºI¨ GªI¨H`ImH`H[ H`GKG®G/EºG/"]], BB: 82, CB: 574, HB: 0, DB: 621, AB: 628.5 }; C["C"] = { sC: ['HNAB I¬ABJ$B;J$C. J$CoI¬C«I_C« ICC«H»CyH»C4 H»BgH©BNH@BN F:BN D&BNCYBcCYD- CYH0 CYI}D+I²EºI² H@I² H©I²H»IyH»I) H»HfICHVI_HV I{HVJ$HbJ$I- J$J"I¬J¿HNJ¿ EºJ¿ CwJ¿BLJbBLH4 BLD) BLA}CuABF:AB'], BB: 69, CB: 561.5, HB: 0, DB: 621, AB: 616 }; C["D"] = { sC: ["J>H4 J>JbH·J¿FvJ¿ C(J¿ B°J¿BgJ³BgJF BgAº BgAmBtABC(AB FRAB H¹ABJ>A}J>D)"], hC: [["I1D- I1BcHdBNFRBN CsBN CsI² FvI² HbI²I1I}I1H0"]], BB: 82, CB: 574, HB: 0, DB: 621, AB: 643.5 }; C["E"] = { sC: ["CsF6 GyF6 H.F6HYFDHYFz HYG#H>GCGyGC CsGC CsI² IiI² I¼I²J>IÀJ>JQ J>J}J$J¿IiJ¿ C(J¿ B°J¿BgJ³BgJF BgAº BgAYB¤ABC(AB IiAB I¼ABJ>AOJ>A§ J>B/J$BNIiBN CsBN"], BB: 82, CB: 574, HB: 0, DB: 621, AB: 621 }; C["F"] = { sC: ["CsA© CsF6 GyF6 H.F6HYFDHYFz HYG#H>GCGyGC CsGC CsI² IiI² I¼I²J>IÀJ>JQ J>J}J$J¿IiJ¿ C(J¿ B°J¿BgJ³BgJF BgA« BgA^BvA4C,A4 C^A4CsASCsA©"], BB: 82, CB: 574, HB: -7, DB: 621, AB: 600.5 }; C["G"] = { sC: ['H»D± H»C, H»BcH©BNH@BN EºBN D)BNCYBcCYD) CYH4 CYI{D)I²F:I² H@I² H©I²H»I{H»I+ H»HpI5HVI_HV I¬HVJ$HpJ$I/ J$J"I¬J¿HNJ¿ F:J¿ CyJ¿BLJhBLH: BLD" BLA{CuABEºAB HNAB I¬ABJ$B5J$C! J$E¾ FÃE¾ FfE¾F>E®F>ES F>E*F^D±FÃD±'], BB: 69, CB: 561.5, HB: 0, DB: 621, AB: 629.5 }; C["H"] = { sC: ["CsA© CsE¼ I1E¼ I1A© I1AEIVA4I{A4 J0A4J>A^J>A© J>JU J>J·IÂK)IwK) I?K)I1J¡I1JU I1G% CsG% CsJU CsJ¥C`K)C(K) B°K)BgJÁBgJU BgA© BgA>BµA4C,A4 C^A4CsASCsA©"], BB: 82, CB: 574, HB: -7, DB: 627.5, AB: 656 }; C["I"] = { sC: ["CsA¥ CsJY CsJ¿CGK)C,K) B´K)BgJ¿BgJY BgA¥ BgABB²A4C*A4 CdA4CsA^CsA¥"], BB: 82, CB: 152, HB: -7, DB: 627.5, AB: 234 }; C["J"] = { sC: ["EUB> C`B>B´BTB´D$ B´DVBvDzBLDz AÀDzA¥DZA¥D$ A¥AlC,A2EUA2 G¡A2I%AlI%C¶ I%JY I%J¿H|K)H`K) H@K)G¼J»G¼J[ G¼C¼ G¼BTGIB>EUB>"], BB: 32, CB: 498, HB: -8, DB: 627.5, AB: 577 }; C["K"] = { sC: ["I}Aw I}A¯IqAÀIcB- E,Fv HbJ0 HxJJHzJdHzJj HzJ³HTK)H4K) G¼K)G¨J»GuJ§ CsFf CsJU CsJ½CGK)C,K) B´K)BgJ¿BgJY BgA¥ BgABB²A4C*A4 CKA4CsACCsA© CsEE DFF+ HvAY H©ACH½A4I5A4 IQA4I}AOI}Aw"], BB: 82, CB: 541, HB: -7, DB: 627.5, AB: 546.5 }; C["L"] = { sC: ["C(AB H~AB ICABIQAlIQA© IQB-I9BNH~BN CsBN CsJ[ CsJ»CKK)C,K) B°K)BgJ»BgJ[ BgA¸ BgAMB°ABC(AB"], BB: 82, CB: 519.5, HB: 0, DB: 627.5, AB: 541 }; C["M"] = { sC: ['FfEc F©EcF»EwF¿E{ IZI? IZA¯ IZAMIwA4IÂA4 JHA4JhAKJhA© JhJU JhJµJLK)J"K) I¨K)IoJ»IZJ} FfFv CsJ} C^J¿CEK)C(K) B°K)BgJÁBgJU BgA© BgA>BµA4C,A4 CfA4CsA`CsA¯ CsI? F1E{ F6EuFFEcFfEc'], BB: 82, CB: 594.5, HB: -7, DB: 627.5, AB: 676.5 }; C["N"] = { sC: ["I{A4 J0A4J>A^J>A© J>JU J>J·IÂK)IwK) IZK)I1J¿I1JP I1C( CsJ} C^J¿CEK)C(K) B°K)BgJÁBgJU BgA© BgA>BµA4C,A4 CfA4CsAWCsA£ CsI3 ICAB IIA:IaA4I{A4"], BB: 82, CB: 574, HB: -7, DB: 627.5, AB: 656 }; C["O"] = { sC: ["F+A0 HLA0IºB]IºD¦ IºGZ IºI¤HLK-F+K- C«K-B>I¤B>GZ B>D¦ B>B]C«A0F+A0"], hC: [["F+IÄ GºIÄH­I#H­GU H­D¬ H­C6G¶B=F+B= DBB=CKC6CKD¬ CKGU CKI#D>IÄF+IÄ"]], BB: 62, CB: 554.5, HB: -9, DB: 629.5, AB: 617 }; C["P"] = { sC: ["CsA¥ CsF6 F|F6 HfF6ImG%ImHp ImJjH>K$EÀK$ C(K$ B°K$BgJ½BgJP BgA¥ BgABB²A4C*A4 CdA4CsA^CsA¥"], hC: [["EÀGC CsGC CsI¼ EÀI¼ G°I¼H`I¢H`Hp H`GeGÄGCEÀGC"]], BB: 82, CB: 533, HB: -7, DB: 625.5, AB: 566 }; C["Q"] = { sC: ["F+A0 FÁA0G¬AIHWAy H³A@ I!A0I;A*IOA* IwA*I´AOI´Am I´A©I¦A¾IwB) I?B] IyC%IºC¯IºD¦ IºGZ IºI¤HLK-F+K- C«K-B>I¤B>GZ B>D¦ B>B]C«A0F+A0"], hC: [["F+IÄ GºIÄH­I#H­GU H­D¬ H­D7HxCsHWC? G¡C´ GaD-GGD3G7D3 F«D3FlC±FlCm FlCWF¢C=F±C4 GoBe G;BJFzB=F+B= DBB=CKC6CKD¬ CKGU CKI#D>IÄF+IÄ"]], BB: 62, CB: 554.5, HB: -12, DB: 629.5, AB: 617 }; C["R"] = { sC: ['G¼FR H¿FxImGZImHv ImJtH>K/EºK/ C(K/ B°K/BgK"BgJY BgA¥ BgABB²A4C*A4 CdA4CsA^CsA¥ CsF6 F^F6 GºE2HnB"HpA¥ HrAbH¥A4I3A4 I_A4I}AYI}A¥ I}AÀI!E,G¼FR'], hC: [["CsI¼ EºI¼ G¦I¼H`I¦H`Hp H`G]G®GCEºGC CsGC"]], BB: 82, CB: 541, HB: -7, DB: 630.5, AB: 594.5 }; C["S"] = { sC: ['CEHb CEI#CiIÂDµIÂ FbIÂ HxIÂIAI°IAH< IAG®I]GiIªGi J$GiJPG{JPH< JPJxI!K+FbK+ EMK+ B®K+B9I~B9Hh B9G5B¤FRDHF+ H^EG H|E?ICD¨ICC£ ICC;I!B>G¬B> F"B> C¶B>CGBTCGD$ CGDVC,DzB¦Dz BTDzB9DZB9D$ B9AjCkA2F"A2 G_A2 I¢A2JPBaJPC{ JPD±I¶F+HDFR D+G1 CuG?CEG¨CEHb'], BB: 59.5, CB: 583, HB: -8, DB: 628.5, AB: 642.5 }; C["T"] = { sC: ["H0J¿ BHJ¿ A§J¿AuJrAuJU AuJ:A§I²BHI² DnI² DnA¥ DnACD½A4E;A4 E^A4E²ACE²A¥ E²I² H0I² HxI²H§J8H§JS H§J{HnJ¿H0J¿"], BB: 25, CB: 481, HB: -7, DB: 621, AB: 507.5 }; C["U"] = { sC: ["I#J[ I#D¬ I#C6H,B=FDB= D]B=CfC6CfD¬ CfJ[ CfJ»C=K)BÁK) B¦K)BXJ¿BXJY BXD¦ BXB]CÄA0FDA0 HfA0J0B]J0D¦ J0JY J0J¿IªK)ImK) IMK)I#J½I#J["], BB: 75, CB: 567, HB: -9, DB: 627.5, AB: 642.5 }; C["V"] = { sC: ['I+J§ EºB° B¢J§ BvJÁBZK;B7K; B"K;AqK-AqJz AqJnAsJ`AwJS EEAB FfAB J4JS J8J`J:JnJ:Jz J:K-I¨K;IuK; IVK;I;K&I+J§'], BB: 23, CB: 572, HB: 0, DB: 636.5, AB: 595.5 }; C["W"] = { sC: ["K°B~ I9J{ I)K+H©K;HfK; HPK;H&K-G¸J} ECB~ B¦J© BvK3BVK=B9K= A«K=AwK$AwJ£ AwJzAwJvA¡J^ D|AB E¬AB HfIO KCAB LSAB ONJU OVJnOVJrOVJz OVJ³OPK5N·K5 NwK5NWK)NIJ¡"], BB: 26, CB: 906, HB: 0, DB: 637.5, AB: 932.5 }; C["X"] = { sC: ["IMK) I/K)H¿J·H¯J¡ E²F­ B·J¡ BªJµBtK)BRK) BBK)A±JÁA±Jd A±J[A³JHAÄJ2 E2F- AÄB) AµA¸A±A§A±Au A±AKB5A4BRA4 BnA4B¨AEB·A[ E²EQ H¯A[ H½AII-A4IMA4 IkA4I¶AGI¶Au I¶A§I²A¸I¢B) FpF- I¢J2 I´JJI¶J[I¶Jd I¶J¿IcK)IMK)"], BB: 38, CB: 552.5, HB: -7, DB: 627.5, AB: 590.5 }; C["Y"] = { sC: ["D¿Eº D¿A£ D¿AEECA4EgA4 F$A4F2A`F2A£ F2Eº ITJ4 I]JBIiJQIiJh IiJ³I?K)I#K) HµK)H~JÃHbJ¡ EgF­ BjJ¡ BZJ·BFK)B)K) A­K)AfJ±AfJh AfJQAqJBAyJ4"], BB: 17.5, CB: 531, HB: -7, DB: 627.5, AB: 549.5 }; C["Z"] = { sC: ['B"AB I!AB IoABI{AlI{A© I{B@ISBNI!BN C[BN I{I¼ I{J¿ B|J¿ B;J¿AÄJ£AÄJU AÄIÀBHI²B|I² HFI² B"B>'], BB: 47.5, CB: 540, HB: 0, DB: 621, AB: 587.5 }; C["0"] = { sC: ["J.Cw J.Hh J.J$H±K$G3K$ EQK$ CwK$BVJ$BVHh BVCw BVB9CwA8EQA8 G3A8 H±A8J.B9J.Cw"], hC: [["CdH£ CdIAD5IºE;Iº GIIº HPIºI!IAI!H£ I!C[ I!B½HPBDGIBD E;BD D5BDCdB½CdC["]], BB: 74, CB: 566, HB: -5, DB: 625.5, AB: 640.5 }; C["1"] = { sC: ["C#I¼ C#A¥ C#A^C4A4CkA4 CÄA4D1A^D1A¥ D1K1 D1KkC£K|CiK| CMK|C:KqC%K_ B/Jj A±JJA¯J4A¯J% A¯I¶A¼ImBNIm BcImB|IuB·I®"], BB: 37, CB: 183.5, HB: -7, DB: 668.5, AB: 269.5 }; C["2"] = { sC: ["I¸H< I¸JlHnK$FLK$ C¶K$ B¦K$B>JfB>I7 B>HnBiH`B¦H` C=H`CKH©CKI7 CKI¨C^I¼CÄI¼ FLI¼ H6I¼H«I¨H«H8 H«F)B>EºB>B& B>A8 I=A8 I¬A8I¸AbI¸A} I¸B7IoBDI=BD CKBD CqE?I¸E^I¸H<"], BB: 62, CB: 553.5, HB: -5, DB: 625.5, AB: 614 }; C["3"] = { sC: ["F¤I¼ HYI¼H«IIH«HP H«GUG5F¨EÀF¨ EaF¨E5FxE5F> E5E©E`EwEÀEw G*EwH«D±H«C´ H«B¹HYBDF¤BD EMBD DFBDCGBvCGC* CGCgC,C¡B¤C¡ BVC¡B;CfB;C# B;B+CGA8E?A8 FhA8 HÃA8I¶AÄI¶D3 I¶DµH³E°H6F> H±FjI¶GMI¶H+ I¶J<HÃK$FhK$ E?K$ CGK$B;J2B;I7 B;HlBgH`B¤H` C,H`CGHxCGI3 CGIiDJI¼EMI¼"], BB: 60.5, CB: 552.5, HB: -5, DB: 625.5, AB: 621 }; C["4"] = { sC: ["HµC{ I7C{IeC«IeD@ IeDzI7DªHµDª H8Dª H8K$ F·K$ A§D¯ A§C{ G#C{ G#A£ G#AMGGA4GsA4 G°A4H8A@H8A£ H8C{"], hC: [["G#Dª C#Dª G#Iu"]], BB: 33, CB: 529, HB: -7, DB: 625.5, AB: 563 }; C["5"] = { sC: ["B¢CU BeCUB=C8B=B² B=AÂDjA0E¸A0 H6A0I¤B_I¤D¬ I¤F»GÀH.F:H. C`H. CkI? CsIªC±I¼D@I¼ H^I¼ HÃI¼I/JBI/J^ I/J¡HÃK$H^K$ DPK$ C0K$BiJfBZI! BHG! FLG! G;G!HvFbHvD¬ HvC;G¦B=E¸B= D-B=C0CUB¢CU"], BB: 61.5, CB: 543.5, HB: -9, DB: 625.5, AB: 593.5 }; C["6"] = { sC: ['B"Dc B"BeCkA0E²A0 H2A0I}BeI}Dd I}FfH2G¼E²G¼ E#G¼D>G£CqGQ D<H§EEIsF8J$ FHJ,FtJBFtJl FtJµFTK+EÂK+ ECK+B"I+B"Dc'], hC: [["C0Dd C0E¸D)F¯E²F¯ GwF¯HpE¸HpDd HpC2GuB=E²B= D+B=C0C2C0Dd"]], BB: 48.5, CB: 541, HB: -9, DB: 628.5, AB: 580 }; C["7"] = { sC: ['DÃA. EMA.EcAUEmAm I)JB I/JWI1JhI1Jp I1J³HÃK/HlK/ CSK/ BBK/A}JpA}IA A}HvB&HjBBHj B|HjB¬H·B¬IA B¬I®B½J"CdJ" G¬J" DZAÀ DTAµDLA¥DLAo DLA<D¦A.DÃA.'], BB: 29, CB: 503.5, HB: -10, DB: 630.5, AB: 527 }; C["8"] = { sC: ["J(CÀ J(D»I°E}I=F> IªFrJ(GQJ(HT J(J±HlK$F`K$ E¾K$ C±K$BPJ±BPHT BPGQBtFtC=F> BpE£BPD¿BPCÀ BPAoC}A8E¾A8 F`A8 H£A8J(AqJ(CÀ"], hC: [["C^CÄ C^EiD/E}E¾E} F`E} HLE}H¿EiH¿CÄ H¿BVHLBDF`BD E¾BD D+BDC^BXC^CÄ", "H¿HP H¿F­HTF«F`F« E¾F« D)F«C^F¯C^HP C^I¼D+I¼EºI¼ F`I¼ HVI¼H¿IºH¿HP"]], BB: 71, CB: 563, HB: -5, DB: 625.5, AB: 634.5 }; C["9"] = { sC: ['A·HP A·E¶DfE}F"E} F±E}GqE«H:F) GUC=D¿B1CwB1 C6B1C%A©C%Al C%AGC:A!CwA! FxA!ImC¾ImHP ImJbG¼K$F"K$ D¦K$A·J¯A·HP'], hC: [['F"I¼ GºI¼H`IIH`HP H`GYGÂF«F"F« DlF«BÃF½BÃHP BÃI¨D¦I¼F"I¼']], BB: 41, CB: 533, HB: -16, DB: 625.5, AB: 581 }; C["!"] = { sC: ["C©DB C©Jv C©K9C[KIC?KI C#KIBzK9BzJv BzDB BzC}C!CoC=Co CfCoC©C©C©DB", "C?B_ B´B_BHB7BHA{ BHA<Bµ@ºC?@º Cu@ºD8A>D8A{ D8B;CmB_C?B_"], BB: 67, CB: 187, HB: -21.5, DB: 643.5, AB: 253.5 }; C["|"] = { sC: ["CmA¥ CmJY CmJ¿CAK)C%K) B®K)BaJ¿BaJY BaA¥ BaABB¬A4C#A4 C^A4CmA^CmA¥"], BB: 79, CB: 149, HB: -7, DB: 627.5, AB: 229 }; C['"'] = { sC: ["BLJt BLHP BLG¬BvG}B´G} C,G}CWG®CWHP CWJt CWK9C.KGBµKG BxKGBLK7BLJt", "C´Jt C´HP C´G¬D:G}DVG} D~G}DÁG¶DÁHP DÁJt DÁK7DtKGDXKG D<KGC´K7C´Jt"], BB: 69, CB: 238, HB: 413, DB: 642.5, AB: 306.5 }; C["'"] = { sC: ["BLJt BLHP BLG¬BvG}B´G} C,G}CWG®CWHP CWJt CWK9C.KGBµKG BxKGBLK7BLJt"], BB: 69, CB: 138.5, HB: 413, DB: 642.5, AB: 207 }; C["#"] = { sC: ['EºH) F¢J8 F¨JHF¨JWF¨J` F¨J©FjK"F>K" E¾K"E¥J©EyJj D¨H) C#H) BcH)BRG£BRGe BRG,B|F¿C#F¿ DRF¿ C¥EA BjEA B$EAA¸D¹A¸D| A¸DaB$D5BjD5 COD5 BjB$ BgA¸BeA©BeA¡ BeAUB¤A:C(A: CSA:CfA[CqAu DdD5 F-D5 EEB& EAAºE?A±E?A£ E?AUE^A:E©A: F1A:FBA[FNAu GAD5 H½D5 IaD5IoD_IoDz IoDÃIVEAH½EA GuEA HDF¿ IVF¿ I¾F¿J*GGJ*Gc J*G¡I¾H)IVH) HxH) I]J6 IaJFIcJPIcJ^ IcJ£IGK"H¿K" HrK"H^J£HTJj GaH)'], hC: [["EgF¿ G.F¿ F^EA D¹EA"]], BB: 41.5, CB: 564, HB: -4, DB: 624.5, AB: 607 }; C["$"] = { sC: ["C²Bg EmBg EmA£ EmABE´A4F-A4 FlA4FzA[FzA§ FzBg G¨Bg IIBgI¸CMI¸Dp I¸EyIaF©G¬F© FzF© FzHv H0Hv HvHvH«HhH«G¾ H«GYI/GIIOGI IyGII¸GcI¸GÂ I¸H³I{I¤H>I¤ FzI¤ FzJ[ FzJÁFNK)F/K) E£K)EmJ§EmJY EmI¤ DJI¤ BpI¤B9H±B9G¨ B9F¤BrE{DJE{ EmE{ EmCs CÀCs C`CsCEC¡CEDR CED|C6E!B¢E! BgE!B9D»B9DN B9C[BTBgC²Bg"], hC: [["D$F© CqF©CEG3CEG´ CEHdCfHvD$Hv EmHv EmF©", "H)E{ H`E{H«E?H«Dd H«C¼HrCsH)Cs FzCs FzE{"]], BB: 59.5, CB: 553.5, HB: -7, DB: 627.5, AB: 613 }; C["%"] = { sC: ["H©II HpIIHYI9HLI- BeC­ BPCwBDCfBDCK BDBÃBnBªB¬Bª B·BªC*B¬CEC! I-HH I7HRIKHnIKH§ IKI/I!IIH©II", "B]HF B]GcC,FµC´Fµ D|FµEYGcEYHF EYI#D|IqC´Iq C,IqB]I#B]HF", "F6D& F6CCF¹BtG£Bt HdBtI3CCI3D& I3D®HdE[G£E[ F¹E[F6D®F6D&"], hC: [[], ["CkHF CkHVC}HdC´Hd CÂHdD8HWD8HF D8H.CÂGÂC´GÂ C¥GÂCkH.CkHF"], ["GYD& GYD<GmDNG£DN GºDNH&D>H&D& H&C¶G¸C£G£C£ GmC£GYC´GYD&"]], BB: 65, CB: 516.5, HB: 88.5, DB: 535, AB: 583 }; C["&"] = { sC: ['C.F¢ B;F"AµD¹AµD$ AµA{C´@¶E=@¶ E¾@¶F¢A6GUA¡ G°A> H$A#H>@ºHW@º Hj@ºH¹A#H¹AW H¹AfH·A{H§A¯ H2Bg HhC4H©C´H©D~ H©EKH`EWHDEW G¬EWG}E,G}D~ G}D>GoC©GSCW C¼GU CdG¶CSHDCSHd CSIuDJJBE2JB F:JBF>H§F»H§ GAH§G_I#G_II G_IuFrKNE2KN C¯KNBBJBBBHd BBGªB~G3C.F¢'], hC: [["F|Bj F>B7EwAÂE=AÂ DLAÂBÁBTBÁD$ BÁD¤C?EaC«E¸"]], BB: 40, CB: 490, HB: -23.5, DB: 646, AB: 521 }; C["("] = { sC: ["DvA` CfA`C^AdC^CE C^H» C^J}CfJ¡DvJ¡ DvK® CIK®BPK¨BPH» BPCE BP@XCI@RDv@R"], BB: 71, CB: 217.5, HB: -56, DB: 676.5, AB: 264.5 }; C[")"] = { sC: ["AÂA` AÂ@R CK@RDD@XDDCE DDH» DDK¨CKK®AÂK® AÂJ¡ C0J¡C8J}C8H» C8CE C8AdC0A`AÂA`"], BB: 46.5, CB: 193, HB: -56, DB: 676.5, AB: 264.5 }; C["*"] = { sC: ['D¿F¿ D¿G¨ E¬GKE´GCF+GC F`GCFpG{FpGª FpH)FXH<FBHJ EeH¥ FBI7 FXIEFpIXFpI{ FpI¼FTJ>F+J> E´J>E´J<D¿I} D¿Jf D¿K+DtK9DXK9 D1K9C²K!C²Jf C²I} C!J6B½J>B¤J> BLJ>B>IªB>I{ B>I_BNIGBlI7 CIH¥ BjHJ BNH:B>H"B>Gª B>GiBZGCB¤GC B½GCB½GEC²G¨ C²F¿ C²FXD:FHDVFH DrFHD¿FXD¿F¿'], BB: 62, CB: 342.5, HB: 323, DB: 635.5, AB: 405 }; C["+"] = { sC: ["D¤D< D¤Aj D¤ACD±@ºEG@º E£@ºE°ACE°Aj E°D< H6D< HhD<H¯DXH¯D¤ H¯E0HlEKH6EK E°EK E°GÀ E°HdEeHrEIHr E!HrD¤HYD¤GÀ D¤EK BTEK A¸EKA§DÃA§D¨ A§DcAºD<BTD<"], BB: 33, CB: 485, HB: -21.5, DB: 471.5, AB: 518.5 }; C[","] = { sC: ['BÁ@C CmAf CwAyC{A©C{Aµ C{BLC(BVB¹BV B|BVBaBFBRA¼ B"@p AÄ@eAÀ@TAÀ@L AÀ?¾B;?«B]?« B¢?«Bµ@&BÁ@C'], BB: 45.5, CB: 156, HB: -93, DB: 74, AB: 220.5 }; C["-"] = { sC: ["F¢EK BÃEK BcEKBPDÃBPD¨ BPDcBeD<BÃD< F¢D< G/D<GUDXGUD¤ GUE0G3EKF¢EK"], BB: 71, CB: 393.5, HB: 189, DB: 260.5, AB: 464.5 }; C["."] = { sC: ["C6@º Cd@ºD-A<D-A{ D-B7CfB_C6B_ B¬B_B>B9B>A{ B>A>B¤@ºC6@º"], BB: 62, CB: 181.5, HB: -21.5, DB: 78, AB: 244 }; C["/"] = { sC: ["BÁAM F<JB FDJUFNJ£FNJ« FNK=E¾KKE©KK E^KKEKK&EAJµ B&B) AºA£AµAhAµAW AµA!BD@¸BX@¸ B¤@¸B¹A:BÁAM"], BB: 40, CB: 326, HB: -22.5, DB: 644.5, AB: 366 }; C[":"] = { sC: ["CGG, CuG,D>GQD>G² D>HLCwHtCGHt B½HtBPHNBPG² BPGSBµG,CGG,", "CGA{ CuA{D>AÂD>B_ D>B½CwCACGCA B½CABPB¿BPB_ BPAÄBµA{CGA{"], BB: 71, CB: 190, HB: 28, DB: 472.5, AB: 261.5 }; C[";"] = { sC: ["CGG, CuG,D>GQD>G² D>HLCwHtCGHt B½HtBPHNBPG² BPGSBµG,CGG,", "C`A% D-BH D7B]D:BjD:Bv D:C0CiC:CWC: C;C:BÃC*BµB~ BeAS BcAGB_A8B_A0 B_@¢B|@mB¿@m C?@mCS@®C`A%"], BB: 71, CB: 190, HB: -43, DB: 472.5, AB: 264.5 }; C["<"] = { sC: ["B-E« GuBn GªBaG¼B]H)B] H^B]HlB¹HlC# HlCAHWCSH:Cf CSFL H:I/ HLI7HlITHlIw HlIÀHLJ6H&J6 G¶J6G¥J.GwJ% B-F¯ A³F|A¥FfA¥FL A¥F:A¯EÀB-E«"], BB: 32, CB: 468.5, HB: 77, DB: 570, AB: 535 }; C["="] = { sC: ["F­F- C,F- BnF-B]E¥B]Eg B]ECBpDÁC,DÁ F­DÁ G;DÁGaE9GaEc GaE´G?F-F­F-", "F­Gw C,Gw BnGwB]GKB]G/ B]F¯BpFhC,Fh F­Fh G;FhGaF¦GaG, GaGZG?GwF­Gw"], BB: 77, CB: 399, HB: 238, DB: 410, AB: 476.5 }; C[">"] = { sC: ["H§E« I%EÀI/F:I/FL I/FfI!F|H§F¯ C;J% C0J.BÁJ6B®J6 BgJ6BFIÀBFIw BFITBgI7BxI/ G_FL BxCf BZCSBFCABFC# BFB¹BTB]B¬B] B»B]C*BaC=Bn"], BB: 66, CB: 502.5, HB: 77, DB: 570, AB: 535 }; C["?"] = { sC: ["DxD< DxC{E!CiE=Ci EYCiE§CyE§D< E§E{ G#F& HjF^I+GAI+Ht I+I¸H[KIFTKI E?KI C8KIA­J·A­HY A­GºB5G¨BRG¨ BnG¨B»GºB»HY B»J*CgJ<E?J< FvJ< G¡J<GÂI=GÂHt GÂG¶GsGMG9G= DxFf", "E=@º Ek@ºF4A<F4A{ F4B7EmB_E=B_ D³B_DFB9DFA{ DFA>D¬@ºE=@º"], BB: 36, CB: 500.5, HB: -21.5, DB: 643.5, AB: 540 }; C["@"] = { sC: ["BHGE BHD» BHB_CwA#E}A# G²A# IKA#IiAÀIiB´ IiC^I=CkHÃCk HjCkH[C?H[B¹ H[BHHJB1G¥B1 E}B1 D3B1CUC:CUD» CUGE CUI#D3J,E}J, F4J, G}J,H[I#H[GE H[E¼HLEcGÂEK H)EoH+E¼H+FJ H+G¶GwH|EÂH| DJH|C¸G¶C¸FJ C¸D¢DJCºEÂCº IOCºIiEKIiGE IiI¢H:K9F4K9 E}K9 CwK9BHI¢BHGE"], hC: [["EÂE# E0E#E!E?E!FJ E!GSE0GoEÂGo F³GoFÁGQFÁFJ FÁEAF³E#EÂE#"]], BB: 67, CB: 531, HB: -15, DB: 635.5, AB: 597.5 }; C["["] = { sC: ["CmA` CmJ¡ D¨J¡ D¨K® BaK® Ba@R D¨@R D¨A`"], BB: 79, CB: 225.5, HB: -56, DB: 676.5, AB: 272 }; C["]"] = { sC: ["C8A` AÂA` AÂ@R DD@R DDK® AÂK® AÂJ¡ C8J¡"], BB: 46.5, CB: 193, HB: -56, DB: 676.5, AB: 272 }; C["^"] = { sC: ["B®Fn C8FnCIF«CUG! DtI¤ E°G! EºF³F-FnFZFn F¤FnF½F©F½G. F½G9F½GAF¹GM E9K9 D-K9 BNGM BJGABJG7BJG. BJF©BjFnB®Fn"], BB: 68, CB: 364, HB: 341.5, DB: 635.5, AB: 432.5 }; C["_"] = { sC: ["H+A` AyA` A2A`A#A6A#@½ A#@tA<@RAy@R H+@R Hr@RH¢@|H¢@º H¢A>HhA`H+A`"], BB: -15, CB: 478.5, HB: -56, DB: 14.5, AB: 463.5 }; C[" "] = { sC: [], BB: 1e4, CB: -1e4, HB: 1e4, DB: -1e4, AB: 253.5 }; return C } }.apply(C, D), A !== undefined && (B.exports = A)) }, function (B, C, H) { var D, A; !(D = [], A = function () { return function (B) { var C = { reverseHoles: false, reverseShapes: true }, H = " "; C["A"] = { BB: -7, CB: 675, HB: 0, DB: 714, AB: 667 }; C["B"] = { BB: 76, CB: 667, HB: 0, DB: 714, AB: 704 }; C["X"] = { BB: -3, CB: 651, HB: 0, DB: 714, AB: 648 }; C["Y"] = { BB: -6, CB: 654, HB: 0, DB: 714, AB: 648 }; C["Z"] = { shapeCmds: [[[567, -22], [622, 7], [663, -46.5, 694, -96.5], [633.5, -128.5], [606, -78, 567, -22]], [[320, -17.5], [378.5, 7], [414, -50.5, 440, -104.5], [375.5, -131.5], [353.5, -77, 320, -17.5]], [[831, -17.5], [883.5, 18], [934.5, -38, 976.5, -93.5], [918.5, -134.5], [882.5, -78, 831, -17.5]], [[131.5, 20.5], [188, -13.5], [140.5, -80, 87.5, -139.5], [34, -97.5], [87.5, -43.5, 131.5, 20.5]], [[625.5, 526.5], [625.5, 762], [696, 762], [696, 526.5], [625.5, 526.5]], [[835.5, 812], [906, 812], [906, 511], [905, 423, 811.5, 421], [754.5, 419, 670.5, 421], [665, 455.5, 657, 490.5], [739, 485.5, 783, 485.5], [835.5, 485.5, 835.5, 537.5], [835.5, 812]], [[67, 263], [218.5, 327.5, 322, 411.5], [273, 411.5], [273, 553], [192, 472, 69, 408.5], [46.5, 436, 23, 463], [166, 524.5, 253.5, 605.5], [56.5, 605.5], [56.5, 661.5], [273, 661.5], [273, 729.5], [180.5, 726, 88.5, 723], [86.5, 730.5, 76, 777.5], [312, 784.5, 517.5, 799], [529, 743.5], [434.5, 737.5, 341.5, 732.5], [341.5, 661.5], [551.5, 661.5], [551.5, 605.5], [341.5, 605.5], [341.5, 561], [372, 591], [459.5, 548, 547.5, 502], [508.5, 452.5], [428.5, 497.5, 341.5, 543], [341.5, 427], [357, 441.5, 373, 456.5], [456, 456.5], [431.5, 430, 405, 405.5], [728.5, 405.5], [728.5, 358.5], [673.5, 297], [856, 297], [856, 20], [161, 20], [161, 235.5], [135.5, 223, 110, 210], [90.5, 238.5, 67, 263]]], holeCmds: [[], [], [], [], [], [], [[[226.5, 134], [226.5, 70.5], [475.5, 70.5], [475.5, 134], [226.5, 134]], [[790, 183], [790, 246.5], [541, 246.5], [541, 183], [790, 183]], [[541, 70.5], [790, 70.5], [790, 134], [541, 134], [541, 70.5]], [[226.5, 246.5], [226.5, 183], [475.5, 183], [475.5, 246.5], [226.5, 246.5]], [[596.5, 297], [646, 356.5], [347.5, 356.5], [309.5, 325.5, 264.5, 297], [596.5, 297]]]], BB: 23, CB: 976.5, HB: -139.5, DB: 812, AB: 999.5 }; C["a"] = { shapeCmds: [[[0, 0], [0, 36.4 - 20.6, 23.6 - 23.6, 36.4 - 6.4, 14.3 - 23.6, 36.4, -23.6], [0, 3, 1.2], [0, 3 - 1.3, 3.1 - 2.5, 3 + .3, 1.7 - 2.5, 3, -2.5], [0, -2.7, -13.3], [0, -.3, -1.6, -2.2, -2.3, -3.5, -1.3], [0, -10.9, 8.1], [0, -1.4, 1, -1.1, 3.2, .5, 3.9], [0, 2.9, 1.1], [0, -3.7, 8, -10.5, 14, -18.6, 16.7], [0, -3, 1, -6.1, -1.2, -6.1, -4.4], [0, 0, -33.4], [0, 12.5, 0], [0, 2.1, 0, 4.1, -1.5, 4.3, -3.7], [0, .2, -2.4, -1.7, -4.5, -4.1, -4.5], [0, -12.5, 0], [0, 0, -11], [0, 6, -1.8, 10.4, -7.4, 10.3, -14], [0, -.1, -7.6, -6.4, -13.9, -14, -14.2], [0, -8.1, -.2, -14.8, 6.3, -14.8, 14.4], [0, 0, 6.5, 4.4, 12, 10.3, 13.8], [0, 0, 11], [0, -12.5, 0], [0, -2.1, 0, -4.1, 1.5, -4.3, 3.7], [0, -.2, 2.4, 1.7, 4.5, 4.1, 4.5], [0, 12.8, 0], [0, 0, 33.4], [0, 0, 3.2, -3.1, 5.4, -6.1, 4.4], [0, -8.1, -2.8, -14.9, -8.7, -18.6, -16.7], [0, 2.9, -1.1], [0, 1.6, -.6, 1.9, -2.8, .5, -3.9], [0, -10.9, -8.1], [0, -1.3, -1, -3.2, -.3, -3.5, 1.3], [0, -2.7, 13.3], [0, -.3, 1.7, 1.3, 3.1, 3, 2.5], [0, 3, -1.2], [0, 6.4, 14.3, 20.6, 23.6, 36.4, 23.6]]], holeCmds: [[function (B) { return [[0, -72.5], [0, 2.76 * B, 0 * B, 5 * B, -2.24 * B, 5 * B, -5 * B], [0, 0 * B, -2.76 * B, -2.24 * B, -5 * B, -5 * B, -5 * B], [0, -2.76 * B, 0 * B, -5 * B, 2.24 * B, -5 * B, 5 * B], [0, 0 * B, 2.76 * B, 2.24 * B, 5 * B, 5 * B, 5 * B]] }(1.6)]], reverseShape: false, reverseHole: false, xFactor: 7, yFactor: -7, xShift: 350, BB: -340, CB: 340, HB: 47, DB: 806, AB: 700, show: true }; C["á"] = { shapeCmds: [[[0, 0], [0, 36.4 - 20.6, 23.6 - 23.6, 36.4 - 6.4, 14.3 - 23.6, 36.4, -23.6], [0, 3, 1.2], [0, 3 - 1.3, 3.1 - 2.5, 3 + .3, 1.7 - 2.5, 3, -2.5], [0, -2.7, -13.3], [0, -.3, -1.6, -2.2, -2.3, -3.5, -1.3], [0, -10.9, 8.1], [0, -1.4, 1, -1.1, 3.2, .5, 3.9], [0, 2.9, 1.1], [0, -3.7, 8, -10.5, 14, -18.6, 16.7], [0, -3, 1, -6.1, -1.2, -6.1, -4.4], [0, 0, -33.4], [0, 12.5, 0], [0, 2.1, 0, 4.1, -1.5, 4.3, -3.7], [0, .2, -2.4, -1.7, -4.5, -4.1, -4.5], [0, -12.5, 0], [0, 0, -11], [0, 6, -1.8, 10.4, -7.4, 10.3, -14], [0, -.1, -7.6, -6.4, -13.9, -14, -14.2], [0, -8.1, -.2, -14.8, 6.3, -14.8, 14.4], [0, 0, 6.5, 4.4, 12, 10.3, 13.8], [0, 0, 11], [0, -12.5, 0], [0, -2.1, 0, -4.1, 1.5, -4.3, 3.7], [0, -.2, 2.4, 1.7, 4.5, 4.1, 4.5], [0, 12.8, 0], [0, 0, 33.4], [0, 0, 3.2, -3.1, 5.4, -6.1, 4.4], [0, -8.1, -2.8, -14.9, -8.7, -18.6, -16.7], [0, 2.9, -1.1], [0, 1.6, -.6, 1.9, -2.8, .5, -3.9], [0, -10.9, -8.1], [0, -1.3, -1, -3.2, -.3, -3.5, 1.3], [0, -2.7, 13.3], [0, -.3, 1.7, 1.3, 3.1, 3, 2.5], [0, 3, -1.2], [0, 6.4, 14.3, 20.6, 23.6, 36.4, 23.6]], function (B) { return [[0, B * 1.4], [0, 2.76 * B, 0 * B, 5 * B, -2.24 * B, 5 * B, -5 * B], [0, 0 * B, -2.76 * B, -2.24 * B, -5 * B, -5 * B, -5 * B], [0, -2.76 * B, 0 * B, -5 * B, 2.24 * B, -5 * B, 5 * B], [0, 0 * B, 2.76 * B, 2.24 * B, 5 * B, 5 * B, 5 * B]] }(13)], holeCmds: [[function (B) { return [[0, -72.5], [0, 2.76 * B, 0 * B, 5 * B, -2.24 * B, 5 * B, -5 * B], [0, 0 * B, -2.76 * B, -2.24 * B, -5 * B, -5 * B, -5 * B], [0, -2.76 * B, 0 * B, -5 * B, 2.24 * B, -5 * B, 5 * B], [0, 0 * B, 2.76 * B, 2.24 * B, 5 * B, 5 * B, 5 * B]] }(1.6)], [function (B) { return [[0, B * 1.05], [0, 2.76 * B, 0 * B, 5 * B, -2.24 * B, 5 * B, -5 * B], [0, 0 * B, -2.76 * B, -2.24 * B, -5 * B, -5 * B, -5 * B], [0, -2.76 * B, 0 * B, -5 * B, 2.24 * B, -5 * B, 5 * B], [0, 0 * B, 2.76 * B, 2.24 * B, 5 * B, 5 * B, 5 * B]] }(12)]], reverseShape: false, reverseHole: false, xFactor: 7, yFactor: -7, xShift: 475, yShift: -312.6, BB: 20, CB: 950, HB: -145.6, DB: 894.4, AB: 950, show: true }; C["b"] = { BB: 63, CB: 575, HB: -14, DB: 714, AB: 611 }; C["c"] = { BB: 35, CB: 523, HB: -14, DB: 531, AB: 556 }; C["4"] = { BB: 24, CB: 522, HB: 0, DB: 700, AB: 556 }; C["5"] = { BB: 34, CB: 522, HB: -14, DB: 700, AB: 556 }; C[H] = { BB: 31, CB: 400, HB: -4, DB: 644, AB: 278 }; C[" "] = C[H]; return C } }.apply(C, D), A !== undefined && (B.exports = A)) }, function (B, C, H) { "use strict"; B.exports = D; B.exports.default = D; function D(B, C, H) { H = H || 2; var D = C && C.length, G = D ? C[0] * H : B.length, I = A(B, 0, G, H, true), E = []; if (!I || I.next === I.prev) return E; var M, x, n, i, L, K, a; if (D) I = J(B, C, I, H); if (B.length > 80 * H) { M = n = B[0]; x = i = B[1]; for (var t = H; t < G; t += H) { L = B[t]; K = B[t + 1]; if (L < M) M = L; if (K < x) x = K; if (L > n) n = L; if (K > i) i = K } a = Math.max(n - M, i - x); a = a !== 0 ? 1 / a : 0 } F(I, E, H, M, x, a); return E } function A(B, C, H, D, A) { var G, F; if (A === m(B, C, H, D) > 0) { for (G = C; G < H; G += D)F = T(G, B[G], B[G + 1], F) } else { for (G = H - D; G >= C; G -= D)F = T(G, B[G], B[G + 1], F) } if (F && h(F, F.next)) { Z(F); F = F.next } return F } function G(B, C) { if (!B) return B; if (!C) C = B; var H = B, D; do { D = false; if (!H.steiner && (h(H, H.next) || u(H.prev, H, H.next) === 0)) { Z(H); H = C = H.prev; if (H === H.next) break; D = true } else { H = H.next } } while (D || H !== C); return C } function F(B, C, H, D, A, J, n) { if (!B) return; if (!n && J) a(B, D, A, J); var i = B, L, K; while (B.prev !== B.next) { L = B.prev; K = B.next; if (J ? E(B, D, A, J) : I(B)) { C.push(L.i / H); C.push(B.i / H); C.push(K.i / H); Z(B); B = K.next; i = K.next; continue } B = K; if (B === i) { if (!n) { F(G(B), C, H, D, A, J, 1) } else if (n === 1) { B = M(G(B), C, H); F(B, C, H, D, A, J, 2) } else if (n === 2) { x(B, C, H, D, A, J) } break } } } function I(B) { var C = B.prev, H = B, D = B.next; if (u(C, H, D) >= 0) return false; var A = B.next.next; while (A !== B.prev) { if (s(C.x, C.y, H.x, H.y, D.x, D.y, A.x, A.y) && u(A.prev, A, A.next) >= 0) return false; A = A.next } return true } function E(B, C, H, D) { var A = B.prev, G = B, F = B.next; if (u(A, G, F) >= 0) return false; var I = A.x < G.x ? A.x < F.x ? A.x : F.x : G.x < F.x ? G.x : F.x, E = A.y < G.y ? A.y < F.y ? A.y : F.y : G.y < F.y ? G.y : F.y, M = A.x > G.x ? A.x > F.x ? A.x : F.x : G.x > F.x ? G.x : F.x, x = A.y > G.y ? A.y > F.y ? A.y : F.y : G.y > F.y ? G.y : F.y; var J = y(I, E, C, H, D), n = y(M, x, C, H, D); var i = B.prevZ, L = B.nextZ; while (i && i.z >= J && L && L.z <= n) { if (i !== B.prev && i !== B.next && s(A.x, A.y, G.x, G.y, F.x, F.y, i.x, i.y) && u(i.prev, i, i.next) >= 0) return false; i = i.prevZ; if (L !== B.prev && L !== B.next && s(A.x, A.y, G.x, G.y, F.x, F.y, L.x, L.y) && u(L.prev, L, L.next) >= 0) return false; L = L.nextZ } while (i && i.z >= J) { if (i !== B.prev && i !== B.next && s(A.x, A.y, G.x, G.y, F.x, F.y, i.x, i.y) && u(i.prev, i, i.next) >= 0) return false; i = i.prevZ } while (L && L.z <= n) { if (L !== B.prev && L !== B.next && s(A.x, A.y, G.x, G.y, F.x, F.y, L.x, L.y) && u(L.prev, L, L.next) >= 0) return false; L = L.nextZ } return true } function M(B, C, H) { var D = B; do { var A = D.prev, F = D.next.next; if (!h(A, F) && w(A, D, D.next, F) && o(A, F) && o(F, A)) { C.push(A.i / H); C.push(D.i / H); C.push(F.i / H); Z(D); Z(D.next); D = B = F } D = D.next } while (D !== B); return G(D) } function x(B, C, H, D, A, I) { var E = B; do { var M = E.next.next; while (M !== E.prev) { if (E.i !== M.i && r(E, M)) { var x = V(E, M); E = G(E, E.next); x = G(x, x.next); F(E, C, H, D, A, I); F(x, C, H, D, A, I); return } M = M.next } E = E.next } while (E !== B) } function J(B, C, H, D) { var F = [], I, E, M, x, J; for (I = 0, E = C.length; I < E; I++) { M = C[I] * D; x = I < E - 1 ? C[I + 1] * D : B.length; J = A(B, M, x, D, false); if (J === J.next) J.steiner = true; F.push(e(J)) } F.sort(n); for (I = 0; I < F.length; I++) { i(F[I], H); H = G(H, H.next) } return H } function n(B, C) { return B.x - C.x } function i(B, C) { C = L(B, C); if (C) { var H = V(C, B); G(H, H.next) } } function L(B, C) { var H = C, D = B.x, A = B.y, G = -Infinity, F; do { if (A <= H.y && A >= H.next.y && H.next.y !== H.y) { var I = H.x + (A - H.y) * (H.next.x - H.x) / (H.next.y - H.y); if (I <= D && I > G) { G = I; if (I === D) { if (A === H.y) return H; if (A === H.next.y) return H.next } F = H.x < H.next.x ? H : H.next } } H = H.next } while (H !== C); if (!F) return null; if (D === G) return F; var E = F, M = F.x, x = F.y, J = Infinity, n; H = F; do { if (D >= H.x && H.x >= M && D !== H.x && s(A < x ? D : G, A, M, x, A < x ? G : D, A, H.x, H.y)) { n = Math.abs(A - H.y) / (D - H.x); if (o(H, B) && (n < J || n === J && (H.x > F.x || H.x === F.x && K(F, H)))) { F = H; J = n } } H = H.next } while (H !== E); return F } function K(B, C) { return u(B.prev, B, C.prev) < 0 && u(C.next, B, B.next) < 0 } function a(B, C, H, D) { var A = B; do { if (A.z === null) A.z = y(A.x, A.y, C, H, D); A.prevZ = A.prev; A.nextZ = A.next; A = A.next } while (A !== B); A.prevZ.nextZ = null; A.prevZ = null; t(A) } function t(B) { var C, H, D, A, G, F, I, E, M = 1; do { H = B; B = null; G = null; F = 0; while (H) { F++; D = H; I = 0; for (C = 0; C < M; C++) { I++; D = D.nextZ; if (!D) break } E = M; while (I > 0 || E > 0 && D) { if (I !== 0 && (E === 0 || !D || H.z <= D.z)) { A = H; H = H.nextZ; I-- } else { A = D; D = D.nextZ; E-- } if (G) G.nextZ = A; else B = A; A.prevZ = G; G = A } H = D } G.nextZ = null; M *= 2 } while (F > 1); return B } function y(B, C, H, D, A) { B = 32767 * (B - H) * A; C = 32767 * (C - D) * A; B = (B | B << 8) & 16711935; B = (B | B << 4) & 252645135; B = (B | B << 2) & 858993459; B = (B | B << 1) & 1431655765; C = (C | C << 8) & 16711935; C = (C | C << 4) & 252645135; C = (C | C << 2) & 858993459; C = (C | C << 1) & 1431655765; return B | C << 1 } function e(B) { var C = B, H = B; do { if (C.x < H.x || C.x === H.x && C.y < H.y) H = C; C = C.next } while (C !== B); return H } function s(B, C, H, D, A, G, F, I) { return (A - F) * (C - I) - (B - F) * (G - I) >= 0 && (B - F) * (D - I) - (H - F) * (C - I) >= 0 && (H - F) * (G - I) - (A - F) * (D - I) >= 0 } function r(B, C) { return B.next.i !== C.i && B.prev.i !== C.i && !c(B, C) && (o(B, C) && o(C, B) && N(B, C) && (u(B.prev, B, C.prev) || u(B, C.prev, C)) || h(B, C) && u(B.prev, B, B.next) > 0 && u(C.prev, C, C.next) > 0) } function u(B, C, H) { return (C.y - B.y) * (H.x - C.x) - (C.x - B.x) * (H.y - C.y) } function h(B, C) { return B.x === C.x && B.y === C.y } function w(B, C, H, D) { var A = f(u(B, C, H)); var G = f(u(B, C, D)); var F = f(u(H, D, B)); var I = f(u(H, D, C)); if (A !== G && F !== I) return true; if (A === 0 && d(B, H, C)) return true; if (G === 0 && d(B, D, C)) return true; if (F === 0 && d(H, B, D)) return true; if (I === 0 && d(H, C, D)) return true; return false } function d(B, C, H) { return C.x <= Math.max(B.x, H.x) && C.x >= Math.min(B.x, H.x) && C.y <= Math.max(B.y, H.y) && C.y >= Math.min(B.y, H.y) } function f(B) { return B > 0 ? 1 : B < 0 ? -1 : 0 } function c(B, C) { var H = B; do { if (H.i !== B.i && H.next.i !== B.i && H.i !== C.i && H.next.i !== C.i && w(H, H.next, B, C)) return true; H = H.next } while (H !== B); return false } function o(B, C) { return u(B.prev, B, B.next) < 0 ? u(B, C, B.next) >= 0 && u(B, B.prev, C) >= 0 : u(B, C, B.prev) < 0 || u(B, B.next, C) < 0 } function N(B, C) { var H = B, D = false, A = (B.x + C.x) / 2, G = (B.y + C.y) / 2; do { if (H.y > G !== H.next.y > G && H.next.y !== H.y && A < (H.next.x - H.x) * (G - H.y) / (H.next.y - H.y) + H.x) D = !D; H = H.next } while (H !== B); return D } function V(B, C) { var H = new g(B.i, B.x, B.y), D = new g(C.i, C.x, C.y), A = B.next, G = C.prev; B.next = C; C.prev = B; H.next = A; A.prev = H; D.next = H; H.prev = D; G.next = D; D.prev = G; return D } function T(B, C, H, D) { var A = new g(B, C, H); if (!D) { A.prev = A; A.next = A } else { A.next = D.next; A.prev = D; D.next.prev = A; D.next = A } return A } function Z(B) { B.next.prev = B.prev; B.prev.next = B.next; if (B.prevZ) B.prevZ.nextZ = B.nextZ; if (B.nextZ) B.nextZ.prevZ = B.prevZ } function g(B, C, H) { this.i = B; this.x = C; this.y = H; this.prev = null; this.next = null; this.z = null; this.prevZ = null; this.nextZ = null; this.steiner = false } D.deviation = function (B, C, H, D) { var A = C && C.length; var G = A ? C[0] * H : B.length; var F = Math.abs(m(B, 0, G, H)); if (A) { for (var I = 0, E = C.length; I < E; I++) { var M = C[I] * H; var x = I < E - 1 ? C[I + 1] * H : B.length; F -= Math.abs(m(B, M, x, H)) } } var J = 0; for (I = 0; I < D.length; I += 3) { var n = D[I] * H; var i = D[I + 1] * H; var L = D[I + 2] * H; J += Math.abs((B[n] - B[L]) * (B[i + 1] - B[n + 1]) - (B[n] - B[i]) * (B[L + 1] - B[n + 1])) } return F === 0 && J === 0 ? 0 : Math.abs((J - F) / F) }; function m(B, C, H, D) { var A = 0; for (var G = C, F = H - D; G < H; G += D) { A += (B[F] - B[G]) * (B[G + 1] + B[F + 1]); F = G } return A } D.flatten = function (B) { var C = B[0][0].length, H = { vertices: [], holes: [], dimensions: C }, D = 0; for (var A = 0; A < B.length; A++) { for (var G = 0; G < B[A].length; G++) { for (var F = 0; F < C; F++)H.vertices.push(B[A][G][F]) } if (A > 0) { D += B[A - 1].length; H.holes.push(D) } } return H } }]);
}