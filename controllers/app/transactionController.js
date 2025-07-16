const Transaction = require('../../models/transaction')
const Patient = require('../../models/patient')
const Appointment = require('../../models/appointment')


// Get Patient Transaction
exports.getPatientTransactions = async (req, res) => {
  try {

    const { patientId, appointmentId } = req.query;

    if (!patientId) return res.status(400).json({
      message: 'PatientId is required',
      success: false,
      status: 400
    });

    if (!appointmentId) return res.status(400).json({
      message: 'Appointment Id is required',
      success: false,
      status: 400
    });

    const patient = await Patient.findById({ _id: patientId });
    if (!patient) return res.status(400).json({
      message: 'Patient not found',
      success: false,
      status: 400
    });

    const appointment = await Appointment.findById({ _id: appointmentId }).populate('patientId physioId');
    if (!appointment) return res.status(400).json({
      message: 'Appointment not found',
      success: false,
      status: 400
    });

    const transactions = await Transaction.find({
      patientId: patientId,
      appointmentId: appointmentId
    }).populate('patientId physioId')
    return res.status(200).json({
      message: 'Transactions fetched',
      status: 200,
      success: true,
      data: transactions
    });


  } catch (error) {
    console.log(error)
    return res.status(500).json({
      message: 'Something went wrong',
      status: false,
      status: 500,
      error
    })
  }
};