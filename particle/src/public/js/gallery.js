import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { ImagePanel } from '../ImagePanel';
import gsap from 'gsap';
import { PreventDragClick } from '../PreventDragClick';

export default function example() {
	// Renderer
	const canvas = document.querySelector('#three-canvas');
	const renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: true
	});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);

	// Scene
	const scene = new THREE.Scene();

	// Camera
	const camera = new THREE.PerspectiveCamera(
		30,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	);
	camera.position.z = 4;
	scene.add(camera);

	// Light
	const ambientLight = new THREE.AmbientLight('white', 0.5);
	scene.add(ambientLight);

	const directionalLight = new THREE.DirectionalLight('white', 1);
	directionalLight.position.x = 1;
	directionalLight.position.z = 2;
	scene.add(directionalLight);

	// Controls
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;

    // gltf loader
	const gltfloader = new GLTFLoader();
    let mixer;

	gltfloader.load(
		'/models/metamong.glb',
		gltf => {
			const metamongMesh = gltf.scene.children[0];
            metamongMesh.scale.set(0.2, 0.2, 0.2);
            metamongMesh.rotation.y = -2;
            scene.add(metamongMesh);

            // 애니메이션
            mixer = new THREE.AnimationMixer(metamongMesh);
            const actions = [];
            console.log(gltf.animations);
            actions[0] = mixer.clipAction(gltf.animations[0]);
            // actions[1] = mixer.clipAction(gltf.animations[1]);
            actions[0].repetitions = 1;
            actions[0].clampWhenFinished = true;
            actions[0].play();
		}
	)

    // Mesh
    const planeGeometry = new THREE.PlaneGeometry(0.3, 0.3);
    const textureLoader = new THREE.TextureLoader();
    const boxGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.001);

	// Points
	const sphereGeometry = new THREE.SphereGeometry(1, 8, 8);
    const spherePositionArray = sphereGeometry.attributes.position.array;
    const randomPositionArray = [];
    for (let i = 0; i < spherePositionArray.length; i++) {
        randomPositionArray.push((Math.random() - 0.5) * 10);
    }

    // 여러 개의 Plane Mesh 생성
    const imagePanels = [];
    let imagePanel;
    for (let i = 0; i < spherePositionArray.length; i += 3) {
        imagePanel = new ImagePanel({
            textureLoader,
            scene,
            geometry: boxGeometry,
            imageSrc: `/images/0${Math.ceil(Math.random() * 9)}.png`,
            x: spherePositionArray[i],
            y: spherePositionArray[i + 1],
            z: spherePositionArray[i + 2],
            id: [i]/3
        });
        
        imagePanels.push(imagePanel);
        imagePanels.name = "그림 " + ([i]/3+1);
        console.log(imagePanels.name);
    }

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

	// 그리기
	const clock = new THREE.Clock();

	function draw() {
		const delta = clock.getDelta();

        if (mixer) mixer.update(delta);

		controls.update();

		renderer.render(scene, camera);
		renderer.setAnimationLoop(draw);
	}

    function checkIntersects() {
        if(preventDragClick.mouseMoved) return;

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children);
        for (const item of intersects) {
            // console.log(item.object.name);
            showPopup();
            break;
        }
    }

    // 팝업 띄우기
    function showPopup() {
        document.getElementById("popup_layer").style.display = "block";
    }
    //팝업 닫기
    const btnPopClose = document.getElementById("btnPopClose");
    btnPopClose.addEventListener('click', function() {
        document.getElementById("popup_layer").style.display = "none";
    })

	function setSize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.render(scene, camera);
	}

    function setShape(e) {
        const type = e.target.dataset.type;
        let array;

        switch (type) {
            case 'random':
                array = randomPositionArray;
                break;
            case 'sphere':
                array = spherePositionArray;
                break;
        }

        for (let i = 0; i < imagePanels.length; i++) {
            // 위치 이동 
            gsap.to(
                imagePanels[i].mesh.position,
                {
                    duration: 2,
                    x: array[i * 3],
                    y: array[i * 3 + 1],
                    z: array[i * 3 + 2],
                }
            );

            // 회전
            if (type === 'random') {
                gsap.to(
                    imagePanels[i].mesh.rotation,
                    {
                        duration: 2,
                        x: 0,
                        y: 0,
                        z: 0
                    }
                );
            } else if (type === 'sphere') {
                gsap.to(
                    imagePanels[i].mesh.rotation,
                    {
                        duration: 2,
                        x: imagePanels[i].sphereRotationX,
                        y: imagePanels[i].sphereRotationY,
                        z: imagePanels[i].sphereRotationZ
                    } 
                )
            }
        }
    }

    // 버튼
    const btnWrapper = document.createElement('div');
    btnWrapper.classList.add('btns');

    const randomBtn = document.createElement('button');
    randomBtn.dataset.type = 'random';
    randomBtn.style.cssText = 'position: absolute; left: 20px; top: 20px';
    randomBtn.innerHTML = 'Random';
    btnWrapper.append(randomBtn);

    const sphereBtn = document.createElement('button');
    sphereBtn.dataset.type = 'sphere';
    sphereBtn.style.cssText = 'position: absolute; left: 20px; top: 50px';
    sphereBtn.innerHTML = 'Sphere';
    btnWrapper.append(sphereBtn);

    document.body.append(btnWrapper);

	// 이벤트
    btnWrapper.addEventListener('click', setShape);
	window.addEventListener('resize', setSize);
    canvas.addEventListener('click', e => {
        // raycaster를 사용하려면 -1 ~ 1 로 좌표를 바꿔 줘야 함. 가운데가 0.
        mouse.x = e.clientX / canvas.clientWidth * 2 - 1;
        mouse.y = -(e.clientY / canvas.clientHeight * 2 - 1);
        // console.log(mouse);
        checkIntersects();
    });

    // Drag 클릭 방지
    const preventDragClick = new PreventDragClick(canvas);

	draw();
}