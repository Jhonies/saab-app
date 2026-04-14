const NoticeService = require('../services/NoticeService')

const createNotice = async (req, res) => {
  const { title, body, expiresAt, visibleTo } = req.body

  if (!title?.trim() || !body?.trim()) {
    return res.status(400).json({ message: 'Título e corpo são obrigatórios.' })
  }

  const notice = await NoticeService.createNotice(title, body, expiresAt, visibleTo, req.user.sub)
  return res.status(201).json(notice)
}

const listNotices = async (req, res) => {
  const notices = await NoticeService.listNotices(req.user.role)
  return res.json(notices)
}

const deleteNotice = async (req, res) => {
  try {
    await NoticeService.deleteNotice(req.params.id, req.user.sub, req.user.role)
    return res.status(204).end()
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message })
  }
}

module.exports = { createNotice, listNotices, deleteNotice }
