
const { response } = require('express'); 
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const { generarJWT } = require('../helpers/jwt');

const registerUser = async ( req, res = response ) => {

    const { email, name, password, organizationType } = req.body;

    try {
        // Verificar que el email es único
        const usuario = await Usuario.findOne({ email });

        if ( usuario ) {
            return res.status(400).json({
                ok: false,
                msg: 'User with this email already exists'
            });
        }

        // Crear usuario con el modelo
        const dbUser = new Usuario( req.body );

        // Hashear la contraseña
        const salt = bcrypt.genSaltSync();
        dbUser.password = bcrypt.hashSync( password, salt );

        // Generar JWT
        const token = await generarJWT( dbUser.id, name );
        // Crear usuario de DB
        await dbUser.save();

        // Generar respuesta exitosa
        return res.status(201).json({
            ok: true,
            uid: dbUser.id,
            name,
            email,
            organizationType,
            token
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: 'Wrong Credentials'
        })
    }
}

const loginUser = async (req, res = response ) => {

    const { email, password } = req.body;

    try {
        
        const dbUser = await Usuario.findOne({ email });

        if ( !dbUser ) {
            return res.status(400).json({
                ok: false,
                msg: 'Wrong Credentials'
            });
        }

        // Confirmar si el password coincide
        const validPassword = bcrypt.compareSync( password, dbUser.password );

        if ( !validPassword ) {
            return res.status(400).json({
                ok: false,
                msg: 'Wrong Credentials'
            });
        }

        // Generar JWT
        const token = await generarJWT( dbUser.id, dbUser.name );

        // Respuesta del servicio
        return res.json({
            ok: true,
            uid: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            token,
            organizationType: dbUser.organizationType,
            projectList: dbUser.projectList
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: 'Please contact admin'
        });
    }
}

const renewToken = async (req, res = response ) => {
    
    const { uid } = req;

    // Leer la base de datos
    const dbUser = await Usuario.findById( uid );
    
    // Generar JWT
    const token = await generarJWT( uid , dbUser.name );
    
    return res.json({
        ok: true,
        uid,
        name: dbUser.name,
        email: dbUser.email,
        token,
        organizationType: dbUser.organizationType,
        projectList: dbUser.projectList
    })
}

module.exports = {
    registerUser,
    loginUser,
    renewToken
}
