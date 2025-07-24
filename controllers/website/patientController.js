const Patient = require("../../models/patient");
const jwt = require("jsonwebtoken");
const {
  msg91OTP
} = require('msg91-lib');
const crypto = require('crypto');


function generateRandomCode() {
  // Define the characters to include in the ID
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charsLength = chars.length;

  // Generate 6 random characters
  let id = '';
  for (let i = 0; i < 8; i++) {
    // Generate a random index based on the chars length
    const randomIndex = crypto.randomBytes(1)[0] % charsLength;
    // Append the character at the random index to the ID
    id += chars[randomIndex];
  }

  return id;
}
generateRandomCode()
const msg91otp = new msg91OTP({
  authKey: process.env.MSG91_AUTH_KEY,
  templateId: process.env.MSG91_TEMP_ID
});


exports.signUpOtp = async (req, res) => {
  const {
    phone
  } = req.body;
  let otp = generateRandomCode()
  try {
    await Patient.findOne({
      phone: `+91${phone}`
    }).then(
      async (patientData) => {
        if (patientData) {
          res
            .status(409)
            .json({
              status: true,
              message: "patient already exists please login",
            });
        } else {
          const response = await msg91otp.send(`91${phone}`)
          // console.log("response", response)
          // res.json(response)


          if (response.type === "success") {

            res
              .status(200)
              .json({
                status: true,
                message: "otp sent successfully"
                // message: "",
              });
          } else {
            res.status(200).json({
              status: true,
              message: "otp not sent"
            })
          }
        }
      }
    );
  } catch (error) {
    res.status(400).json({
      status: false,
      message: "otp not sent"
    });
  }
};

exports.loginOtp = async (req, res) => {
  const {
    phone
  } = req.body;
  try {

    let user = await Patient.findOne({
      phone: `+91${phone}`
    })

    // return console.log(user)

    patientData = await Patient.findOne({
      phone: `+91${phone}`
    }).then(
      async (patientData) => {

        if (!patientData) {
          res
            .status(409) // 409 is for conflict
            .json({
              status: true,
              message: "patient does'nt exists please register",
            });
        } else {
          const response = await msg91otp.send(`91${phone}`)
          // res.json(response)

          if (response.type === "success") {
            res
              .status(200)
              .json({
                status: true,
                message: "OTP sent successfully"
              });
          } else {
            res.status(200).json({ status: true, message: "otp not sent" })
          }
        }
      }
    );
  } catch (error) {
    res.status(400).json({
      status: false,
      message: "otp not sent"
    });
  }
};

exports.verifyOtp = async (req, res) => {
  const Otp = req.body.otp;
  const phone = req.body.phone;
  const deviceId = req.body.deviceId;
  const patientData = await Patient.findOne({
    phone: `+91${phone}`
  });
  try {
    if (patientData) {
      const response = await msg91otp.verify(`91${phone}`, Otp)

      if (response.type === "success") {
        jwt.sign({ patient: patientData }, process.env.JWT_SECRET_KEY, (err, token) => {

          res.status(200).json({ status: true, newUser: false, message: "otp verified successfully", token: token, data: patientData })
        });

      } else if (response.type !== "success" || Otp !== "1234") {
        res.status(400).json(
          {
            status: true,
            message: "entered wrong otp"
          }
        )
      }
    } 
    else {
      const response = await msg91otp.verify(`91${phone}`, Otp)
      // console.log(response)
      if (response.type === "success") {
        // Add patient
        const newPatient = await new Patient({
          phone: `+91${phone}`,
          deviceId: deviceId,
          fullName: req.body.fullName ? req.body.fullName : "",
          dob: req.body.dob ? req.body.dob : "",
          gender: req.body.gender ? req.body.gender : "",
        });
        await newPatient.save();

        jwt.sign({ patient: newPatient }, process.env.JWT_SECRET_KEY, (err, token) => {

          res.status(200).json({ status: true, newUser: true, message: "otp verified successfullyddd", token: token, data: newPatient, user: "Signup" })

        });
      } else {

        res.status(400).json({ status: true, message: "entered wrong otp" })
      }
    }
  } catch (err) {
    res.status(400).json({
      status: true,
      message: "entered wrong otp"
    });
  }
};

// get patent by id
exports.patientById = async (req, res) => {
  try {
    const patientId = req.query.patientId;
    if (!patientId) {
      return res.status(400).json({ message: "No patientId provided", status: 400, success: false });
    }
    const patientData = await Patient.findById(patientId);
    if (!patientData) {
      return res.status(200).json({ message: "Patient not found", status: 200, success: false });
    }
    return res.status(200).json({ message: "Patient details", status: 200, success: true, data: patientData });
  } catch (err) {
    return res.status(500).json({ message: "Something went wrong. Please try again", status: 500, success: false });
  }
};

