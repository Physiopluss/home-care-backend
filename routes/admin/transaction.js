const router = require('express').Router();
const transactionController = require('../../controllers/admin/transactionController');

router.get('/getPhysioWithdrawalRequest', transactionController.getPhysioWithdrawalRequest);

// physio withdrawal request
router.get('/getPhystiWithdrawalRequest', transactionController.getPhystiWithdrawalRequest);

// physio transaction
router.get('/getPhysioOnlineTransaction', transactionController.getPhysioOnlineTransaction);
router.get('/getPhysioWithdrawalRequestByDate', transactionController.getPhysioWithdrawalRequestByDate);

// 
router.post("/approvePhysioWithdrawalRequest", transactionController.approvePhysioWithdrawalRequest);

router.get("/getPatientTransaction", transactionController.getPatientTransaction);

router.get("/getPatientTransactionByDate", transactionController.physioRevenue)

module.exports = router;