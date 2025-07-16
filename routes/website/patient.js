const router = require('express').Router();
const patientController = require('../../controllers/website/patientController');

router.post('/signUpOtp', patientController.signUpOtp);
router.post('/loginOtp', patientController.loginOtp);
router.post('/verifyOtp', patientController.verifyOtp);
router.get('/patient-by-id', patientController.patientById);




module.exports = router;                                    









