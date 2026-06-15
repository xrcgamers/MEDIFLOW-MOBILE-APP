const prisma = require("../config/prisma");

async function ensureIncidentThread({ incidentId, createdByUserId = null }) {
  let thread = await prisma.communicationThread.findFirst({
    where: {
      incidentId,
      threadType: "INCIDENT",
    },
  });

  if (!thread) {
    thread = await prisma.communicationThread.create({
      data: {
        incidentId,
        threadType: "INCIDENT",
        createdByUserId,
      },
    });
  }

  return thread;
}

async function ensurePatientThread({ patientId, incidentId, createdByUserId = null }) {
  let thread = await prisma.communicationThread.findFirst({
    where: {
      patientId,
      threadType: "PATIENT",
    },
  });

  if (!thread) {
    thread = await prisma.communicationThread.create({
      data: {
        patientId,
        incidentId,
        threadType: "PATIENT",
        createdByUserId,
      },
    });
  }

  return thread;
}

async function ensureResourceRequestThread({
  resourceRequestId,
  incidentId,
  patientId,
  createdByUserId = null,
}) {
  let thread = await prisma.communicationThread.findFirst({
    where: {
      resourceRequestId,
      threadType: "RESOURCE_REQUEST",
    },
  });

  if (!thread) {
    thread = await prisma.communicationThread.create({
      data: {
        resourceRequestId,
        incidentId,
        patientId,
        threadType: "RESOURCE_REQUEST",
        createdByUserId,
      },
    });
  }

  return thread;
}

async function addParticipantToThread({ threadId, userId, role = null }) {
  if (!userId) return null;

  return prisma.communicationParticipant.upsert({
    where: {
      threadId_userId: {
        threadId,
        userId,
      },
    },
    update: {
      role,
    },
    create: {
      threadId,
      userId,
      role,
    },
  });
}

async function postSystemMessage({ threadId, body, messageType = "INFO" }) {
  return prisma.communicationMessage.create({
    data: {
      threadId,
      body,
      messageType,
      isSystemGenerated: true,
    },
  });
}

async function postMessageToThread({
  threadId,
  body,
  senderUserId = null,
  senderRole = null,
  messageType = "INFO",
}) {
  return prisma.communicationMessage.create({
    data: {
      threadId,
      body,
      senderUserId,
      senderRole,
      messageType,
      isSystemGenerated: false,
    },
  });
}

async function getThreadWithMessages(threadId) {
  return prisma.communicationThread.findUnique({
    where: { id: threadId },
    include: {
      participants: {
        include: {
          user: true,
        },
      },
      messages: {
        include: {
          senderUser: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}

module.exports = {
  ensureIncidentThread,
  ensurePatientThread,
  ensureResourceRequestThread,
  addParticipantToThread,
  postSystemMessage,
  postMessageToThread,
  getThreadWithMessages,
};