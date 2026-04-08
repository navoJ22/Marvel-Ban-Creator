const canvasBan = document.getElementById("canvasBan");
const ctxBan = canvasBan.getContext("2d");

const canvasSave = document.getElementById("canvasSave");
const ctxSave = canvasSave.getContext("2d");

let userImg = new Image();
let mask = new Image();

let banFrame = new Image();
let banBg = new Image();

let saveFrame = new Image();
let saveBg = new Image();

mask.src = "mask.png";

banFrame.src = "BanF.png";
banBg.src = "BanBG.png";

saveFrame.src = "SaveF.png";
saveBg.src = "SaveBG.png";

let scale = 1;
let posX = 0;
let posY = 0;

let dragging = false;
let resizing = false;
let activeCorner = null;

let lastX = 0;
let lastY = 0;

document.getElementById("upload").addEventListener("change", e => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = ev => {
    userImg.src = ev.target.result;
    userImg.onload = () => {
      scale = 1;
      posX = (500 - userImg.width) / 2;
      posY = (500 - userImg.height) / 2;
    };
  };
  reader.readAsDataURL(file);
});

function getCorner(mx, my) {
  const w = userImg.width * scale;
  const h = userImg.height * scale;

  const corners = {
    tl: [posX, posY],
    tr: [posX + w, posY],
    bl: [posX, posY + h],
    br: [posX + w, posY + h]
  };

  for (let key in corners) {
    const [cx, cy] = corners[key];
    if (Math.abs(mx - cx) < 10 && Math.abs(my - cy) < 10) {
      return key;
    }
  }

  return null;
}

canvasBan.addEventListener("mousedown", e => {
  const mx = e.offsetX;
  const my = e.offsetY;

  const corner = getCorner(mx, my);

  if (corner) {
    resizing = true;
    activeCorner = corner;
  } else {
    dragging = true;
  }

  lastX = mx;
  lastY = my;
});

canvasBan.addEventListener("mouseup", () => {
  dragging = false;
  resizing = false;
  activeCorner = null;
});

canvasBan.addEventListener("mousemove", e => {
  const mx = e.offsetX;
  const my = e.offsetY;

  if (dragging) {
    posX += mx - lastX;
    posY += my - lastY;
  }

  if (resizing && activeCorner) {
    const dx = mx - lastX;
    const dy = my - lastY;

    let w = userImg.width * scale;
    let h = userImg.height * scale;

    if (activeCorner === "br") {
      w += dx;
      h += dy;
    }

    if (activeCorner === "tl") {
      w -= dx;
      h -= dy;
      posX += dx;
      posY += dy;
    }

    if (activeCorner === "tr") {
      w += dx;
      h -= dy;
      posY += dy;
    }

    if (activeCorner === "bl") {
      w -= dx;
      h += dy;
      posX += dx;
    }

    const aspect = userImg.height / userImg.width;
    h = w * aspect;

    scale = Math.max(0.2, Math.min(5, w / userImg.width));
  }

  lastX = mx;
  lastY = my;
});

canvasBan.addEventListener("wheel", e => {
  e.preventDefault();

  const centerX = posX + (userImg.width * scale) / 2;
  const centerY = posY + (userImg.height * scale) / 2;

  let newScale = scale + e.deltaY * -0.001;
  newScale = Math.max(0.2, Math.min(5, newScale));

  scale = newScale;

  posX = centerX - (userImg.width * scale) / 2;
  posY = centerY - (userImg.height * scale) / 2;
});

function downloadBoth() {
  download(canvasBan, "ban.png");
  setTimeout(() => {
    download(canvasSave, "save.png");
  }, 200);
}

function drawCanvas(ctx, bg, frame, isExport = false) {
  ctx.clearRect(0, 0, 500, 500);

  ctx.drawImage(bg, 0, 0, 500, 500);

  const temp = document.createElement("canvas");
  temp.width = 500;
  temp.height = 500;
  const tctx = temp.getContext("2d");

  tctx.drawImage(
    userImg,
    posX,
    posY,
    userImg.width * scale,
    userImg.height * scale
  );

  tctx.globalCompositeOperation = "destination-in";
  tctx.drawImage(mask, 0, 0, 500, 500);

  ctx.drawImage(temp, 0, 0);

  ctx.drawImage(frame, 0, 0, 500, 500);

  if (!isExport) { 
    const w = userImg.width * scale;
    const h = userImg.height * scale;

    ctx.strokeStyle = "white";
    ctx.strokeRect(posX, posY, w, h);

    const corners = [
      [posX, posY],
      [posX + w, posY],
      [posX, posY + h],
      [posX + w, posY + h]
    ];

    corners.forEach(([x, y]) => {
      ctx.fillStyle = "white";
      ctx.fillRect(x - 5, y - 5, 10, 10);
    });
  }
}

function draw() {
  drawCanvas(ctxBan, banBg, banFrame);
  drawCanvas(ctxSave, saveBg, saveFrame);
  requestAnimationFrame(draw);
}

draw();

function download(canvas, name) {

  drawCanvas(canvas.getContext("2d"), 
             canvas === canvasBan ? banBg : saveBg, 
             canvas === canvasBan ? banFrame : saveFrame, 
             true); 

  const link = document.createElement("a");
  link.download = name;
  link.href = canvas.toDataURL("image/png");
  link.click();
}