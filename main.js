var eventCenter = {
  on: function(type, handle){
    $(document).on(type, handle)
  },
  fire: function(type, data){
    $(document).trigger(type, data)
  }
}

var footer = {
  init: function(){
    this.$footer = $('footer')
    this.$ul = $('footer ul')
    this.$forward = $('footer .icon-ios-arrow-forward')
    this.$back = $('footer .icon-ios-arrow-back')
    this.$box = $('footer .box')
    this.isToTop = true
    this.moving = false
    this.isToBottom = false
    this.bind()
    this.getData()
  },
  bind: function(){
    var _this = this

    $(window).on('resize', function(){
      _this.setstyle()
    })

    this.$forward.on('click', function(){
      if(_this.moving) return 0
      var itemwidth = _this.$footer.find('li').outerWidth(true)
      var itemcount = Math.floor(_this.$box.width()/itemwidth)
      console.log(itemwidth, itemcount, _this.$box.width())
      if(!_this.isToBottom){
        _this.moving = true
        _this.$ul.animate({
          left: '-=' + itemcount * itemwidth
        }, 400, function(){
           _this.isToTop = false
           _this.moving = false
          if( parseFloat(_this.$box.width()) - parseFloat(_this.$ul.css('left')) >= parseFloat(_this.$ul.css('width')) ){
            _this.isToBottom = true
          }
        })
      }
    })

    this.$back.on('click', function(){
      if(_this.moving) return 0
      
      var itemwidth = $('footer li').outerWidth(true)
      var itemcount = Math.floor(_this.$box.width()/itemwidth)
      if(!_this.isToTop){
        _this.moving = true
        _this.$ul.animate({
          left: '+=' + itemcount * itemwidth
        }, 400, function(){
          _this.moving = false
          _this.isToBottom = false
          if( parseFloat(_this.$ul.css('left')) > -1 ) {
            _this.isToTop = true
          }
        })
      }
    })

    this.$footer.on('click', 'li', function(){
      $(this).addClass('active').siblings().removeClass('active')
      eventCenter.fire('album-name', {
        channelID: $(this).attr('id'),
        channelName: $(this).attr('channel-name')
      })
    })
  },

  getData: function(){
    var _this = this
    $.ajax({
      url: '//jirenguapi.applinzi.com/fm/getChannels.php',
      dataType: 'json',
      type: 'get'
    }).done(function(ret){
      //console.log(ret.channels)
      _this.render(ret)
      $('footer .box ul li:first').trigger('click')
    }).fail(function(){
      console.log('get error data')
    })
  },

  render: function(data){
    var html = ''
    data.channels.forEach(function(node){
      html += '<li id=' + node.channel_id + ' channel-name=' + node.name + '>'
      html += '<div class="cover" style="background-image:url(' + node.cover_small + ')"></div>'
      html += '<h3>' + node.name +'</h3>'
      html += '</li>'
    })
    this.$footer.find('ul').html(html)
    this.setstyle()
  },

  setstyle: function(){
    var count = this.$footer.find('li').length
    var width = this.$footer.find('li').outerWidth(true)
    this.$footer.find('ul').css({
      width: count * width + 'px'
    })
  }
}

var main = {
  init: function(){
    this.$main = $('main')
    this.$btnplay = this.$main.find('.btn-play')
    this.audio = new Audio()
    this.audio.autoplay = true
    this.bind()
  },

  bind: function(){
    var _this = this
    eventCenter.on('album-name', function(e, channelObj){
      _this.channelId = channelObj.channelID
      _this.channelName = channelObj.channelName
      _this.loadMusic()
    })

    this.$btnplay.on('click', function(){
      if($(this).hasClass('icon-ios-play')){
        $(this).removeClass('icon-ios-play').addClass('icon-ios-pause')
        _this.audio.play()
      }else{
        $(this).removeClass('icon-ios-pause').addClass('icon-ios-play')
        _this.audio.pause()
      }
    })

    this.$main.find('.icon-ios-skip-forward').on('click', function(){
      _this.loadMusic()
    })

    this.audio.addEventListener('play', function(){
      clearInterval(_this.statusClock)
      _this.statusClock = setInterval(function(){
        _this.updateStatus()
      }, 1000)
    })

    this.audio.addEventListener('pause', function(){
      clearInterval(_this.statusClock)
    })

    this.$main.find('.bar').on('click', function(e){
      //console.log('click')
      var persent = e.offsetX / _this.$main.find('.bar').width()
      _this.audio.currentTime = persent * _this.audio.duration
      _this.updateStatus()
    })
  },

  loadMusic: function(callback){
    var _this = this
    $.ajax({
      url: '//jirenguapi.applinzi.com/fm/getSong.php',
      type: 'get',
      dataType: 'json',
      data: {
        channel: _this.channelId
      }
    }).done(function(ret){
      _this.song = ret['song'][0]
      _this.songID = _this.song.sid
      _this.setMusic()
      _this.loadLyric()
    })
  },

  loadLyric: function(){
    var _this = this
    $.ajax({
      url: '//jirenguapi.applinzi.com/fm/getLyric.php',
      type: 'get',
      dataType: 'json',
      data: {
        sid: _this.song.sid
      }
    }).done(function(ret){
      var lyric = ret.lyric,
          lyricObj = {}
      //sconsole.log(lyric.split('\n'))
      lyric.split('\n').forEach(function(line){
        var time = line.match(/\d{2}:\d{2}/g),
            str = line.replace(/\[.+?\]/g, '')
        if(Array.isArray(time)){
          time.forEach(function(key){
            lyricObj[key] = str
          })
        }
      })
        _this.lyricObj = lyricObj
        //console.log(lyricObj)
    })
  },

  setMusic: function(){
    this.audio.src = this.song.url
    this.$main.find('.aside figure').css('background-image', 'url(' + this.song.picture + ')')
    $('.bg').css('background-image', 'url(' + this.song.picture + ')')
    this.$main.find('.detail .author').text(this.song.artist)
    this.$main.find('.detail h1').text(this.song.title)
    this.$main.find('.tag').text(this.channelName)
    if(this.$btnplay.hasClass('icon-ios-play')){
      this.$btnplay.removeClass('icon-ios-play').addClass('icon-ios-pause')
    }
  },

  updateStatus: function(){
    var min = Math.floor(this.audio.currentTime/60)
    var second = Math.floor(this.audio.currentTime%60)
    second = second < 10 ? '0' + second : second + ''
    this.$main.find('.current-time').text(min + ':' + second)
    this.$main.find('.bar-progress').css('width', this.audio.currentTime/this.audio.duration * 100 + '%')
    //console.log(this.lyricObj['0' + min + ':' + second])
    var lyric = this.lyricObj['0' + min + ':' + second]
    if (lyric){
      this.$main.find('.lyric p').text(lyric)
    }
  }
}
footer.init()
main.init()