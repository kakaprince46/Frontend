import Dexie from 'dexie'

const db = new Dexie('AttendanceOfflineDB')
db.version(1).stores({
    users: '++id, serverUserId, name, phone, email, fallback_id, is_synced',
    checkins: '++id, userId, sessionId, eventId, checkInTime, is_synced',
})

export const addUserLocally = async (userData) => {
    await db.users.add({
        name: userData.name,
        phone: userData.phone,
        email: userData.email,
        fallback_id: userData.fallback_id,
        is_synced: false
    })
}

export const addCheckInLocally = async (checkInData) => {
    await db.checkins.add({
        userId: checkInData.userId,
        sessionId: checkInData.sessionId,
        eventId: checkInData.eventId,
        checkInTime: new Date(),
        is_synced: false
    })
}

export const getUnsyncedData = async () => {
    const unsyncedUsers = await db.users.where('is_synced').equals(false).toArray()
    const unsyncedCheckins = await db.checkins.where('is_synced').equals(false).toArray()
    return { unsyncedUsers, unsyncedCheckins }
}