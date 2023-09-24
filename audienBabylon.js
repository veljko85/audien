var canvas = document.getElementById("renderCanvasAudien");

var engine = null;
var scene = null;
var sceneToRender = null;
var createDefaultEngine = function () {
  return new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    disableWebGL2Support: false,
  });
};

//for loading
BABYLON.DefaultLoadingScreen.prototype.displayLoadingUI = function () {
  if (document.getElementById("customLoadingScreenDiv")) {
    // Do not add a loading screen if there is already one
    document.getElementById("customLoadingScreenDiv").style.display = "initial";
    return;
  }
  this._loadingDiv = document.createElement("div");
  this._loadingDiv.id = "customLoadingScreenDiv";
  // this._loadingDiv.innerHTML = "scene is currently loading";
  var customLoadingScreenCss = document.createElement("style");
  customLoadingScreenCss.type = "text/css";
  if (document.body.clientWidth > document.body.clientHeight) {
    customLoadingScreenCss.innerHTML = `
          #customLoadingScreenDiv{
              background-image: url("img/loadingBackground.gif");
              background-size: cover;
              background-position: center;
          }
           `;
  } else {
    customLoadingScreenCss.innerHTML = `
          #customLoadingScreenDiv{
              background-image: url("img/loadingBackground.gif");
              background-size: cover;
              background-position: center;
          }
           `;
  }
  document.getElementsByTagName("head")[0].appendChild(customLoadingScreenCss);
  this._resizeLoadingUI();
  window.addEventListener("resize", this._resizeLoadingUI);
  document.body.appendChild(this._loadingDiv);
};

BABYLON.DefaultLoadingScreen.prototype.hideLoadingUI = function () {
  document.getElementById("customLoadingScreenDiv").style.display = "none";
  // console.log("scene is now loaded");
};
//end of loading

var createScene = function () {
  var scene = new BABYLON.Scene(engine);

  // for loading
  engine.displayLoadingUI();

  //scene colors - first color, second transperent
  // scene.clearColor = new BABYLON.Color3.FromHexString("#ff0000");
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

  //camera
  var camera = new BABYLON.ArcRotateCamera(
    "Camera",
    0,
    0,
    0,
    new BABYLON.Vector3(0, 0, 0),
    scene
  );
  camera.attachControl(canvas, false);
  camera.setPosition(new BABYLON.Vector3(0, 0, 4));

  //scroll speed
  camera.wheelPrecision = 1000;

  //camera radius
  camera.lowerRadiusLimit = 2.7;
  camera.upperRadiusLimit = 6;

  //camera radius beta
  // camera.lowerBetaLimit = 0;
  camera.upperBetaLimit = 1.6;

  //enviormant
  scene.environmentTexture = new BABYLON.CubeTexture("studio.env", scene);
  scene.environmentIntensity = 1.5;

  //get elements from dom
  var rotateCont = document.getElementById("rotateCont");
  var openCont = document.getElementById("openCont");

  //function to camera animation
  function animMove(camera, pos) {
    const anim = new BABYLON.Animation(
      "movecam",
      "position",
      120,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3
    );
    anim.setKeys([
      { frame: 0, value: camera.position.clone() },
      { frame: 120, value: pos },
    ]);
    //easing
    const easingFun = new BABYLON.CubicEase();
    easingFun.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
    anim.setEasingFunction(easingFun);
    return anim;
  }

  //function to animate fake mesh Y position
  function animPos(pos, futPos) {
    const anim = new BABYLON.Animation(
      "animPos",
      "position",
      30,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    anim.setKeys([
      { frame: 0, value: pos },
      { frame: 30, value: futPos },
    ]);
    const easingFun = new BABYLON.CubicEase();
    easingFun.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
    anim.setEasingFunction(easingFun);
    return anim;
  }

  //create for rotate
  var rotate = true;
  function rotateCamera() {
    if (rotate) {
      camera.alpha = (camera.alpha % (2 * Math.PI)) + 0.002;
    }
  }

  //aplly for rotate camera
  scene.onBeforeCameraRenderObservable.add(() => {
    rotateCamera();
  });

  //IMPORT MESH
  BABYLON.SceneLoader.ImportMeshAsync("", "mesh/", "audien2.glb").then(
    (result) => {
      var audien = result.meshes[0];

      //stop default mesh animation
      scene.animationGroups
        .find((a) => a.name === "kutija_dnoAction")
        .stop(true, 1, 0);

      //define look of rubber upper part
      scene.getMaterialByID("Glavica").transparencyMode = "Alpha Blend";
      scene.getMaterialByID("Glavica").alpha = 0.6;
      scene.getMaterialByID("Glavica").roughness = 0.8;
      scene.getMaterialByID("Glavica").metalic = 0;
      scene.getMaterialByID("Glavica").separateCullingPass = true;
      scene.getMaterialByID("Glavica").subSurface.isTranslucencyEnabled = true;
      scene.getMaterialByID("Glavica").subSurface.translucencyIntensity = 0.5;
      scene.getMaterialByID("Glavica").albedoColor =
        BABYLON.Color3.FromHexString("#fff4e6");

      //put baked shadows on parts
      var audienMaterials = ["Belo", "Belo_poklopac", "Plava"];
      for (let i = 0; i < audienMaterials.length; i++) {
        scene.getMaterialByID(audienMaterials[i]).ambientTexture =
          new BABYLON.Texture("mesh/bake.png", scene);
        scene.getMaterialByID(audienMaterials[i]).roughness = 0.1;
        scene.getMaterialByID(audienMaterials[i]).ambientTexture.uScale = 1; //and/or the following for vScale:
        scene.getMaterialByID(audienMaterials[i]).ambientTexture.vScale = -1; //(-1.0 or some other value)
      }

      //give press white color
      scene.getMaterialByID("PRESS").albedoColor =
        BABYLON.Color3.FromHexString("#ffffff");

      //OPEN BOX
      //function to open and close box
      function openAndCloseBox() {
        if (!opened) {
          opened = true;
          document.getElementById("openText").innerHTML = "Press to Close Box";

          if (window.innerWidth < window.innerHeight) {
            const boxAnimations = [
              animPos(box.position.clone(), new BABYLON.Vector3(0, 1.4, 0)),
            ];
            scene.beginDirectAnimation(box, boxAnimations, 0, 120, false, 1.5);
            const targetAnimations = [
              animLookAt(selected, new BABYLON.Vector3(0, 1.4, 0)),
            ];
            scene.beginDirectAnimation(
              camera,
              targetAnimations,
              0,
              120,
              false,
              1.5
            );
            selected = new BABYLON.Vector3(0, 1.4, 0);
          }

          const cameraAnimations = [
            animMove(camera, new BABYLON.Vector3(0, 1, 6)),
          ];
          scene.beginDirectAnimation(
            camera,
            cameraAnimations,
            0,
            120,
            false,
            1
          );

          scene.animationGroups
            .find((a) => a.name === "kutija_poklopacAction")
            .start(false, 2, 0);
          scene.animationGroups
            .find((a) => a.name === "teloAction")
            .start(false, 1, 0);
          scene.animationGroups
            .find((a) => a.name === "teloAction.003")
            .start(false, 1, 0);
        } else {
          opened = false;
          document.getElementById("openText").innerHTML = "Press to Open Box";

          if (window.innerWidth < window.innerHeight) {
            const boxAnimations = [
              animPos(box.position.clone(), new BABYLON.Vector3(0, 0.9, 0)),
            ];
            scene.beginDirectAnimation(box, boxAnimations, 0, 120, false, 1.5);
            const targetAnimations = [
              animLookAt(selected, new BABYLON.Vector3(0, 0.9, 0)),
            ];
            scene.beginDirectAnimation(
              camera,
              targetAnimations,
              0,
              120,
              false,
              1.5
            );
            selected = new BABYLON.Vector3(0, 0.9, 0);
          } else {
            const targetAnimations = [
              animLookAt(selected, new BABYLON.Vector3(0, 1, 0)),
            ];
            scene.beginDirectAnimation(
              camera,
              targetAnimations,
              0,
              120,
              false,
              1.5
            );
            selected = new BABYLON.Vector3(0, 1, 0);
          }

          const cameraAnimations = [
            animMove(camera, new BABYLON.Vector3(0, 0, 4)),
          ];
          scene.beginDirectAnimation(
            camera,
            cameraAnimations,
            0,
            120,
            false,
            1
          );

          scene.animationGroups
            .find((a) => a.name === "kutija_poklopacAction")
            .start(false, 1, 1, 0);
          scene.animationGroups
            .find((a) => a.name === "teloAction")
            .start(false, 2, 1, 0);
          scene.animationGroups
            .find((a) => a.name === "teloAction.003")
            .start(false, 2, 1, 0);
        }
        setTimeout(function () {
          camera.target = box;
        }, 1100);
        meshVisibility(1, true);
      }
      //fake mesh for press button to open box
      var pressFakePart = BABYLON.MeshBuilder.CreateCylinder(
        0,
        { height: 0.01, diameter: 0.25, tessellation: 48 },
        scene
      );
      pressFakePart.addRotation(4.7, 0, 0);
      pressFakePart.position = new BABYLON.Vector3(0.01, 0.6, 0.636);
      pressFakePart.visibility = false;
      //boolien for box status open or not
      var opened = false;
      //register action for click on box part to open box
      pressFakePart.actionManager = new BABYLON.ActionManager(scene);
      //action to open and close box on click on box
      pressFakePart.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickUpTrigger,
          function () {
            openAndCloseBox();
          }
        )
      );
      //action to open and close box on click on button
      openCont.onclick = () => {
        openAndCloseBox();
      };
      //start and stop rotate on click
      rotateCont.onclick = () => {
        if (rotate) {
          rotate = false;
          document.getElementById("rotateText").innerHTML =
            "Press to Start Auto Rotate";
          if (!opened) {
            const cameraAnimations = [
              animMove(camera, new BABYLON.Vector3(0, 0, 4)),
            ];
            scene.beginDirectAnimation(
              camera,
              cameraAnimations,
              0,
              120,
              false,
              1
            );
          } else {
            const cameraAnimations = [
              animMove(camera, new BABYLON.Vector3(0, 1, 6)),
            ];
            scene.beginDirectAnimation(
              camera,
              cameraAnimations,
              0,
              120,
              false,
              1
            );
          }
        } else {
          rotate = true;
          document.getElementById("rotateText").innerHTML =
            "Press to Stop Auto Rotate";
          if (!opened) {
            const cameraAnimations = [
              animMove(camera, new BABYLON.Vector3(0, 0, 4)),
            ];
            scene.beginDirectAnimation(
              camera,
              cameraAnimations,
              0,
              120,
              false,
              1
            );
          } else {
            const cameraAnimations = [
              animMove(camera, new BABYLON.Vector3(0, 1, 6)),
            ];
            scene.beginDirectAnimation(
              camera,
              cameraAnimations,
              0,
              120,
              false,
              1
            );
          }
        }
      };
      //animation to target camera
      function animLookAt(lookNow, lookAt) {
        const anim = new BABYLON.Animation(
          "lookcam",
          "target",
          120,
          BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
          BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        anim.setKeys([
          { frame: 0, value: lookNow },
          { frame: 120, value: lookAt },
        ]);
        // easing
        const easingFun = new BABYLON.CubicEase();
        easingFun.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
        anim.setEasingFunction(easingFun);
        return anim;
      }
      //fake box for ear part
      var boxEarRight = new BABYLON.MeshBuilder.CreateBox(
        "box",
        { width: 0.5, height: 0.5, depth: 0.5 },
        scene
      );
      boxEarRight.position = new BABYLON.Vector3(-0.797, 1.576, -0.142);
      boxEarRight.visibility = false;
      //fake box for ear part
      var boxEarLeft = new BABYLON.MeshBuilder.CreateBox(
        "box",
        { width: 0.5, height: 0.5, depth: 0.5 },
        scene
      );
      boxEarLeft.position = new BABYLON.Vector3(0.842, 1.576, -0.142);
      boxEarLeft.visibility = false;
      //selected target position
      var selected = box.position;
      //function to targe parts
      function changeTarget(targetMesh, targetPos) {
        const cameraAnimations = [
          animLookAt(selected, targetPos),
          animMove(camera, new BABYLON.Vector3(0, 0, 4)),
        ];
        scene.beginDirectAnimation(camera, cameraAnimations, 0, 120, false, 1);
        setTimeout(function () {
          camera.target = targetMesh;
        }, 1100);
        selected = targetMesh.position;
      }
      //register action for click on box ear part to target ear part
      boxEarRight.actionManager = new BABYLON.ActionManager(scene);
      //action to target ear part
      boxEarRight.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickUpTrigger,
          function () {
            if (opened) {
              changeTarget(boxEarRight, boxEarRight.position);
              meshVisibility(0.1, false);
              setTimeout(function () {
                textLinks(
                  volumeMesh,
                  false,
                  7,
                  0,
                  -100,
                  -50,
                  -30,
                  "Precise Tuning"
                );
                textLinks(
                  kapicaMesh,
                  false,
                  -7,
                  0,
                  250,
                  -150,
                  -130,
                  "Superior Comfort"
                );
                textLinks(cipMesh, false, -7, 0, 150, 50, 30, "Ergonomic Fit");
                textLinks(
                  procesorMesh,
                  false,
                  7,
                  0,
                  -150,
                  70,
                  40,
                  "Advanced Sound Processor"
                );
              }, 1000);
            }
          }
        )
      );
      //register action for click on box ear part to target ear part
      boxEarLeft.actionManager = new BABYLON.ActionManager(scene);
      //action to target ear part
      boxEarLeft.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickUpTrigger,
          function () {
            if (opened) {
              changeTarget(boxEarLeft, boxEarLeft.position);
            }
          }
        )
      );
      var advancedTexture =
        BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

      function textLinks(
        mesh,
        rendable,
        linex2,
        lineOffX,
        textHolderCircleLeft,
        textHolderTop,
        circleTop,
        textText
      ) {
        //text to show on click
        var lineConectMeshAndText = new BABYLON.GUI.Line();
        lineConectMeshAndText.lineWidth = 4;
        lineConectMeshAndText.color = "white";
        lineConectMeshAndText.x2 = linex2;
        lineConectMeshAndText.linkOffsetY = 0;
        lineConectMeshAndText.linkOffsetX = lineOffX;
        advancedTexture.addControl(lineConectMeshAndText);
        // line3.linkWithMesh(scene.getMeshByName("Sat.004_primitive0"));
        lineConectMeshAndText.linkWithMesh(mesh); //null
        lineConectMeshAndText.notRenderable = rendable;

        var textHolder = new BABYLON.GUI.Rectangle();
        textHolder.width = "150px";
        textHolder.height = "50px";
        // textHolder.cornerRadius = 100;
        // textHolder.color = "White";
        textHolder.thickness = 0;
        // textHolder.background = "white";
        // textHolder.linkWithMesh(scene.getMeshByName("Sat.004_primitive0"));
        // textHolder.linkOffsetY = -250;
        // textHolder.linkOffsetX = -150;
        textHolder.top = textHolderTop + "px";
        textHolder.left = textHolderCircleLeft + "px";
        advancedTexture.addControl(textHolder);
        textHolder.notRenderable = rendable;

        var circle = new BABYLON.GUI.Ellipse();
        circle.thickness = 4;
        circle.width = "18px";
        circle.height = "18px";
        circle.left = textHolderCircleLeft + "px";
        circle.top = circleTop + "px";
        advancedTexture.addControl(circle);
        circle.notRenderable = rendable;

        var text = new BABYLON.GUI.TextBlock();
        text.color = "white";
        text.textWrapping = true;
        text.text = textText;
        text.fontSize = "18px";
        textHolder.addControl(text);
        lineConectMeshAndText.connectedControl = circle;
      }

      function meshVisibility(visibility, isVisible) {
        scene.getMeshByName("kutija.dno_primitive0").visibility = visibility;
        scene.getMeshByName("kutija.dno_primitive1").visibility = visibility;
        scene.getMeshByName("kutija.poklopac").visibility = visibility;
        scene.getMeshByName("kapica.001").isVisible = isVisible;
        scene.getMeshByName("telo.001_primitive0").isVisible = isVisible;
        scene.getMeshByName("telo.001_primitive1").isVisible = isVisible;
        scene.getMeshByName("telo.001_primitive2").isVisible = isVisible;
        scene.getMeshByName("volume.001").isVisible = isVisible;
      }
      var volumeMesh = scene.getMeshByName("volume");
      var kapicaMesh = scene.getMeshByName("kapica");
      var cipMesh = scene.getMeshByName("telo_primitive2");
      var procesorMesh = scene.getMeshByName("telo_primitive1");

      //for loading
      engine.hideLoadingUI();
    }
  );

  //mesh for camera target
  var box = new BABYLON.MeshBuilder.CreateBox(
    "box",
    { width: 0.1, height: 0.1, depth: 0.1 },
    scene
  );
  camera.target = box;
  if (window.innerWidth > window.innerHeight) {
    box.position = new BABYLON.Vector3(0, 1, 0);
  } else {
    box.position = new BABYLON.Vector3(0, 0.9, 0);
  }
  box.visibility = false;

  //END OF SCENE
  return scene;
};

window.initFunction = async function () {
  var asyncEngineCreation = async function () {
    try {
      return createDefaultEngine();
    } catch (e) {
      console.log(
        "the available createEngine function failed. Creating the default engine instead"
      );
      return createDefaultEngine();
    }
  };

  window.engine = await asyncEngineCreation();
  if (!engine) throw "engine should not be null.";
  window.scene = createScene();
};
initFunction().then(() => {
  sceneToRender = scene;
  engine.runRenderLoop(function () {
    if (sceneToRender && sceneToRender.activeCamera) {
      sceneToRender.render();
    }
  });
});

// Resize
window.addEventListener("resize", function () {
  engine.resize();
});
