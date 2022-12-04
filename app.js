//1. Invocamos a express
const express = require("express");
const app = express();
const port = 10101;
//Invocamos nodemailer
const nodemailer = require("nodemailer");

//2. Seteamos urlencoded para capturar los datos del formulario para no tener errores
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//3. Invocar a dotenv
const dotenv = require("dotenv");
dotenv.config({ path: "./env/.env" });

//4. Setear el directorio public
app.use("/resources", express.static("public"));
app.use("/resources", express.static(__dirname + "/public"));

//5. Establecer el motor de plantillas
app.set("view engine", "ejs");

//6. Invocar al modulo para hashear
const bcryptjs = require("bcryptjs");

//7. configurar variables de sesion
const session = require("express-session");
app.use(
    session({
        secret: "secret",
        resave: true,
        saveUninitialized: true,
    })
);

//8. Invocamos al modulo de conexzion de la base de datos
const connection = require("./database/db");

//9.Estableciendo las rutas
app.get("/ingreso", (req, res) => {
    res.render("ingreso");
});

//10. Registracion
app.post("/ingreso", async(req, res) => {
    const user = req.body.user;
    const email = req.body.email;
    const pass = req.body.pass;
    let passwordHaash = await bcryptjs.hash(pass, 8);
    connection.query(
        "INSERT INTO users SET ?", { user: user, email: email, pass: passwordHaash },
        async(error, results) => {
            if (error) {
                console.log(error);
            } else {
                res.render("ingreso", {
                    alert: true,
                    alertTitle: "Registration",
                    alertMessage: "¡successful Registration!",
                    alertIcon: "success",
                    showConfirmButton: false,
                    timer: 1500,
                    ruta: "",
                });
                const transporter = nodemailer.createTransport({
                    host: "smtp.gmail.com",
                    port: 587,
                    auth: {
                        user: "your email",
                        pass: "your key",
                    },
                });
                // send email
                transporter
                    .sendMail({
                        from: "your email",
                        to: email,
                        subject: "Registro EXITOSO!",
                        html: { path: "./views/bienvenida.ejs" },
                    })
                    .then((res) => {
                        console.log(res);
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            }
        }
    );
});

//11. autenticacion
app.post("/auth", async(req, res) => {
    const user = req.body.user;
    const pass = req.body.pass;
    let passwordHaash = await bcryptjs.hash(pass, 8);
    if (user && pass) {
        connection.query(
            "SELECT * FROM users WHERE user = ?", [user],
            async(error, results, fields) => {
                if (
                    results.length == 0 ||
                    !(await bcryptjs.compare(pass, results[0].pass))
                ) {
                    res.render("ingreso", {
                        alert: true,
                        alertTitle: "Error",
                        alertMessage: "Usuario y/o Password incorrectas",
                        alertIcon: "error",
                        showConfirmButton: true,
                        timer: false,
                        ruta: "ingreso",
                    });
                } else {
                    req.session.loggedin = true; //nos ayuda a auntenticar en las demas paginas
                    req.session.user = results[0].user;
                    res.render("ingreso", {
                        alert: true,
                        alertTitle: "Conexion exitosa",
                        alertMessage: "¡LOGIN CORRECTO!",
                        alertIcon: "success",
                        showConfirmButton: false,
                        timer: 1500,
                        ruta: "",
                    });
                }
            }
        );
    } else {
        res.render("ingreso", {
            alert: true,
            alertTitle: "Advertencia",
            alertMessage: "¡Por favor ingrese un usuario y/o contraseña!",
            alertIcon: "warning",
            showConfirmButton: true,
            timer: false,
            ruta: "ingreso",
        });
    }
});

//12. Autenticacion para el resto de las paginas

app.get("/", (req, res) => {
    if (req.session.loggedin) {
        res.render("index", {
            login: true,
            user: req.session.user,
        });
    } else {
        res.render("index", {
            login: false,
            user: "Debe iniciar sesion",
        });
    }
});

//13. Logout
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

app.listen(port, (req, res) => {
    console.log(`SERVER RUNNING IN ${port}`);
});
