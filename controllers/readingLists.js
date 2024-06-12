const router = require('express').Router()
const { User, Blog, ReadingList, ReadingListMembership} = require('../models')
const userFinder = require('../middleware/userFinder')
const bcrypt = require('bcrypt')
const tokenExtractor = require("../middleware/tokenExtractor");
const isAdmin = require("../middleware/isAdmin");
const {where} = require("sequelize");
const saltRounds = 10

router.get('/', async (req, res) => {
    const readingLists = await ReadingList.findAll({
        include: [
            {
                model: Blog,
                attributes: { exclude: ['userId'] },
                through: {
                    attributes: []
                }
            },
            {
                model: User,
                attributes: { exclude: ['passwordHash', 'createdAt', 'updatedAt'] }
            }
        ]
    })
    // This sets the status code to 200 by default and ends the request-response cycle.
    return res.json(readingLists)
})

// router.get('/:id', userFinder, async (req, res) => {
//     return req.user ? res.json(req.user) : res.status(404).json( { message: 'User not found.' })
// })
//
router.post('/', tokenExtractor, async (req, res) => {
    const user = await User.findByPk(req.decodedToken.id)
    const readingList = await ReadingList.create({...req.body, userId: user.id})
    return res.status(201).json(readingList)
})

router.post('/:id', tokenExtractor, async (req, res) => {
    const user = await User.findByPk(req.decodedToken.id)
    if (!user) return res.status(404).json('User must be logged in.')
    const userReadingLists = await ReadingList.findAll({ where: { userId: user.id }})
    const readingList = await ReadingList.findByPk(req.params.id)
    // A user may only modify his or her own reading lists.
    if (!(userReadingLists.some(rl => rl.id === readingList.id))) {
        return res.status(401).json('You do not have access to other users reading lists.')
    }
    const readingListMembership = await ReadingListMembership.create({...req.body, blogId: req.body.blogId, readingListId: readingList.id})
    return res.status(201).json(readingListMembership)
})
//
// router.put('/:username', tokenExtractor, isAdmin, async(req, res) => {
//     function updateUser(user) {
//         if (req.body.username !== undefined) {
//             user.username = req.body.username
//         }
//         if (req.body.disabled !== undefined) {
//             user.disabled = req.body.disable
//         }
//         if (req.body.admin !== undefined) {
//             user.admin = req.body.admin
//         }
//     }
//     const user = await User.findOne({
//         where:
//             { username: req.params.username }
//     })
//
//     if (!user) {
//         return res.status(404).json('User not found.')
//     }
//
//     console.log('User: ', user)
//
//     updateUser(user)
//     await user.save()
//     return res.json(user)
// })

module.exports = router