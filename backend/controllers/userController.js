const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../middleware/sendMail");

module.exports.signup = async (req, res) => {
    try {
        let { profileImage, name, email, mobNumber, password } = req.body;
        if (!name) {
            throw new Error("Name is missing");
        }
        if (!email) {
            throw new Error("Email is missing");
        }
        if (!mobNumber) {
            throw new Error("Mobile number is missing");
        }
        if (!password) {
            throw new Error("Password is missing");
        }
        const user = await User.findOne({ $or: [{ email: email }, { mobNumber: mobNumber }] })
        if (user) {
            throw new Error("User Already exists");
        }

        const salt = bcrypt.genSaltSync(10);
        const hashPassword = bcrypt.hashSync(password, salt);
        let newUser = new User({ profileImage: null, name: name, email: email, mobNumber: mobNumber, password: hashPassword });
        await newUser.save().then((res) => {
            req.user = newUser;
            sendMail(newUser.email, newUser.name, "Welcome to EasyStay !");
            res.status(201).json(newUser);;
        }).catch((err) => {
            throw new Error(err);
        })
    } catch (err) {
        res.json({
            message: err.message || err,
            error: true,
            suceess: false,
        })
    }

}

module.exports.login = async (req, res) => {
    try {
        let { email, password } = req.body;
        if (!email) {
            throw new Error("Email is missing");
        }
        if (!password) {
            throw new Error("Password is missing");
        }
        const user = await User.findOne({ email: email });
        if (!user) {
            throw new Error("User not registered");
        }

        const checkPassword = await bcrypt.compare(password, user.password);
        if (checkPassword) {
            const tokenData = {
                _id: user._id,
                email: user.email,
            }
            const token = jwt.sign(tokenData, 'mysecret', { expiresIn: 7 * 24 * 60 * 60 * 1000 });
            const tokenOption = {
                httpOnly: true,
                secure: true,
            }
            res.cookie("token", token, tokenOption).status(200).json({
                message: 'Login successfully',
                data: token,
                success: true,
                error: false,
            })
        } else {
            throw new Error("Please check Password");
        }

    } catch (err) {
        res.json({
            message: err.message || err,
            error: true,
            success: false,
        })
    }


}

module.exports.logout = async (req, res) => {
    try {
        res.clearCookie('token')
        res.json({
            message: "Logged Out successfully",
            error: false,
            success: true,
            data: [],
        })
    } catch (err) {
        res.json({
            message: err.message || err,
            error: true,
            success: false,
        })
    }
}