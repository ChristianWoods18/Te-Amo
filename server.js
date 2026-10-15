const express=require("express"), multer=require("multer"), rateLimit=require("express-rate-limit");
const fs=require("fs"), path=require("path"), crypto=require("crypto");

const DIR=path.join(__dirname,"uploads");            // outside "public", so it is never served openly
fs.mkdirSync(DIR,{recursive:true});
const EXT={"image/jpeg":".jpg","image/png":".png","image/webp":".webp","image/gif":".gif"};

const upload=multer({
  storage:multer.diskStorage({
    destination:DIR,
    filename:(req,f,cb)=>cb(null,Date.now()+"-"+crypto.randomUUID()+EXT[f.mimetype])
  }),
  limits:{fileSize:15*1024*1024,files:1},
  fileFilter:(req,f,cb)=>cb(null,!!EXT[f.mimetype])
});

const app=express();
app.set("trust proxy",1);

app.post("/api/upload",
  rateLimit({windowMs:60_000,max:20}),
  upload.single("image"),
  (req,res)=>res.sendStatus(req.file?204:400));

// Owner-only area: the browser asks for a password (the username can be anything)
const auth=(req,res,next)=>{
  const [,p]=Buffer.from((req.headers.authorization||"").split(" ")[1]||"","base64").toString().split(":");
  if(process.env.ADMIN_PASSWORD && p===process.env.ADMIN_PASSWORD) return next();
  res.set("WWW-Authenticate",'Basic realm="admin"').sendStatus(401);
};
app.get("/admin",auth,(req,res)=>{
  const files=fs.readdirSync(DIR).sort().reverse();
  res.send(`<body style="background:#111;color:#eee;font-family:serif"><h2>${files.length} uploads</h2>`+
    files.map(f=>`<a href="/admin/file/${f}"><img src="/admin/file/${f}" width="160" loading="lazy"></a>`).join(" "));
});
app.use("/admin/file",auth,express.static(DIR));

app.use(express.static(path.join(__dirname,"public")));   // your index.html, song.mp3 and heart PNGs go in /public
app.listen(process.env.PORT||3000,()=>console.log("running"));
