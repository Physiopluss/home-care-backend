const cron = require("node-cron");
const Chat = require('./models/chatroom');
const Appointment = require('./models/appointment');
const Physio = require('./models/physio');
const moment = require('moment');


async function sendAppointmentReminders() {
    try {
        const todayStart = moment().tz('Asia/Kolkata').startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSSSS');
        const todayEnd = moment().tz('Asia/Kolkata').endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSSSS');
        const startwindow = moment().tz("Asia/Kolkata").add(-30, "minutes").format("YYYY-MM-DDTHH:mm:ss.SSSSSS");
        const endwindow = moment().tz("Asia/Kolkata").format("YYYY-MM-DDTHH:mm:ss.SSSSSS");

        const appointments = await Appointment.find({
            date: { $gte: todayStart, $lte: todayEnd },
            appointmentCompleted: false,
            time: { $gte: startwindow, $lte: endwindow },
            reminderSent: false
        })


        const physioIds = [...new Set(appointments.map(appointment => appointment.physioId))];

        let chats = await Chat.find({ physioId: { $in: physioIds } }, { _id: 1, physioId: 1 });

        const appointmentsByPhysio = physioIds.reduce((acc, physioId) => {
            acc[physioId] = appointments.filter(appt => String(appt.physioId) === String(physioId));
            return acc;
        }, {});

        await Promise.all(
            chats.map(async (chat) => {
                const physioAppointments = appointmentsByPhysio[chat.physioId] || [];

                if (physioAppointments.length > 0) {
                    // Send reminders in chat
                    await Chat.findOneAndUpdate(
                        { _id: chat._id },
                        {
                            $addToSet: {
                                messages: {
                                    message: JSON.stringify(physioAppointments),
                                    sender: "Admin",
                                    isReadByPatient: false,
                                    isReadByPhysio: false,
                                }
                            },
                            $set: {
                                updatedAt: moment().tz('Asia/Kolkata').format('YYYY-MM-DDTHH:mm:ss.SSSSSS')
                            }
                        },
                        { new: true }
                    );

                    // Mark these appointments as reminderSent: true
                    const appointmentIds = physioAppointments.map(appt => appt._id);
                    await Appointment.updateMany(
                        { _id: { $in: appointmentIds } },
                        { $set: { reminderSent: true } }
                    );
                }
            })
        );


    } catch (error) {
        console.error(error);
    }
}
async function TreatmentNotification2() {
    try {
        const todayStart = moment().tz("Asia/Kolkata").startOf("day").add(19, "day").format("YYYY-MM-DDTHH:mm:ss.SSSSSS");
        // const todayStart = new Date("2025-04-27T00:00:00.000000")

        // create window because  handle buffer time and corner case like - 
        const windowStart = moment().tz("Asia/Kolkata").add(-30, "minutes").format("h:mm A");
        const windowEnd = moment().tz("Asia/kolkata").format("h:mm A");

        const appointments = await Appointment.find(
            {

                "isTreatmentScheduled.startTime": { $gte: windowStart, $lte: windowEnd },//remidertime,
                "isTreatmentScheduled.treatmentDate": {
                    $elemMatch: {
                        "date": todayStart // todayStart

                    }
                },

            });

        const physioIds = [
            ...new Set(appointments.map((appointment) => appointment.physioId)),
        ];

        // Get all roomIds for the given physioIds
        let chats = await Chat.find(
            { physioId: { $in: physioIds } },
            { _id: 1, physioId: 1 }
        );

        const appointmentsByPhysio = physioIds.reduce((acc, physioId) => {
            acc[physioId] = appointments.filter(
                (appt) => String(appt.physioId) === String(physioId)
            );
            return acc;
        }, {});

        await Promise.all(
            chats.map(async (chat) => {
                const physioAppointments = appointmentsByPhysio[chat.physioId] || [];

                if (physioAppointments.length > 0) {

                    await Chat.findOneAndUpdate(
                        { _id: chat._id },
                        {
                            $push: {
                                messages: {
                                    message: JSON.stringify(physioAppointments),
                                    sender: "Admin"
                                }
                            },
                            $set: {
                                updatedAt: moment().tz('Asia/Kolkata').format('YYYY-MM-DDTHH:mm:ss.SSSSSS')
                            }
                        },
                        { new: true }
                    );

                }
            })
        );
    } catch (error) {
        console.error(error);
    }
}


// Delist physios with subscriptionId as null
async function delistPhysio() {
    try {
        const physios = await Physio.find({ isDeleted: false, subscriptionId: null, accountStatus: 1 });

        const res = await Promise.all(
            physios.map((physio) =>
                Physio.findByIdAndUpdate(physio._id, { accountStatus: 0 })
            )
        );

        if (res.length) console.log(`\n👀 Successfully delisted ${res.length} physios`);

    } catch (error) {
        console.error(error);
    }
}


// Every Minute Jobs
let isJobRunning = false
cron.schedule("* * * * *", async () => {
    if (isJobRunning) {
        console.log("Job is still running, skipping this round.");
        return;
    }
    isJobRunning = true;

    try {
        await sendAppointmentReminders();
        await TreatmentNotification2();
    } catch (error) {
        console.error("Error in scheduled job:", error);
    } finally {
        isJobRunning = false;
    }
});


// Every 5 Minutes Jobs
cron.schedule('*/5 * * * *', async () => {
    try {
        await delistPhysio();
    } catch (err) {
        console.error('Error running delistPhysio:', err);
    }
});
