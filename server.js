const express = require('express')
const app = express()
const logger = require('morgan')
const bodyParser = require('body-parser')
const fs = require('fs')
const cors = require('cors')
const CryptoJS = require("crypto-js");

// express 설정
app.use(cors())
app.use(logger('dev'))
app.use(express.static('public'));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// 전역 변수 설정
let encType = ""

// Index 페이지
app.get('/', (req, res) => {
  res.redirect('/index.html')
})
app.get('/index', (req, res) => {
  res.redirect('/index.html')
})

// Login Routing
// 로그인 페이지
app.get('/login', (req, res) => {
  res.redirect('/login.html')
})

// 로그인 처리
app.post('/login', (req, res) => {
  let id = req.body.id
  let pw = req.body.pw

  fs.readFile(__dirname +'/data/members.json', (err, data) => {
    let members = JSON.parse(data.toString()).users

    let isMemberValid = false
    members.forEach(member => {
      let serverId, serverPw, serverSalt

      // AES 방식 - 서버에서 복호화하여 ID/PW 체크
      if(encType == 'aes') {
        serverId = member.id
        serverSalt = member.salt
        serverPw = CryptoJS.AES.decrypt(member.pw, serverSalt).toString(CryptoJS.enc.Utf8)
        
      // SHA256 방식 - 클라이언트에서 암호화 되어, 암호화 된 상태로 비교
      } else if(encType == 'sha256') {
        serverId = member.id
        serverPw = member.pw

      // 암호화 사용 안할 경우
      } else {
        serverId = member.id
        serverPw = member.pw
      }
      
      if(serverId == id && serverPw == pw) {
        isMemberValid = true
      }
    })

    res.send(isMemberValid)
  })
})


// 회원 가입 Routing
// 회원 가입 페이지
app.get('/signUp', (req, res) => {
  res.redirect('/signUp.html')
})

// 회원 가입 처리
app.post('/signUp', (req, res) => {
  let id = req.body.id
  let pw, salt

  // AES 방식 - 서버에서 암호화 처리 후 저장
  if(encType == 'aes') {
    salt = 'learnershi' + Math.round(Math.random() * 100000)
    pw = CryptoJS.AES.encrypt(req.body.pw, salt).toString()

  // SHA256 방식 - 암호화된 상태로 전송 받음
  } else if(encType == 'sha256') {
    pw = req.body.pw
    salt = req.body.salt
  
  // 암호화 사용 안할 경우
  } else {
    pw = req.body.pw
    salt = ''
  }
  
  // 새로운 유저 Data
  let newUser = {id, pw, salt, encType}

  fs.readFile(__dirname + '/data/members.json', (err, data) => {
    let members = JSON.parse(data.toString())
    members.users.push(newUser)
    let newMembers = JSON.stringify(members)

    fs.writeFile(__dirname +'/data/members.json', newMembers, 'utf8', (err) => {
      if(err) {
        console.log('signUp - err : ', err)
        res.send(false)
      } else {
        console.log('회원 등록 완료!')
        res.send(true)
      }
    })
  })
})


// 암호화 타입 Routing
// 암호화 타입 전송
app.get('/encType', (req, res) => {
  res.send(encType)
})

// 암호화 타입 변경
app.put('/encType', (req, res) => {
  let newEncType = req.body.encType
  
  let isSuccess = true
  if(newEncType !== 'undefined') {
    encType = newEncType
  } else {
    isSuccess = false
  }

  res.send({ encType, isSuccess })
})

app.listen('3006', () => {
  console.log('3006 Port Connected!')
})
