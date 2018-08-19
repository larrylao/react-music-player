import React, { Component } from 'react';
import $ from 'jquery'
import 'jplayer'

import"./style/grobal.css";
import"./style/icon.css";
//component
import Header from "./view/header/header";
//import Player from "./view/player/player";
import Musiclist from "./view/musicList/musicList"
//路由
import {HashRouter as Router,Route} from "react-router-dom";
//api
import MUSIC_LIST from "./config/musicList.js";

import Pubsub from "pubsub-js";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
         currentMusicItem:MUSIC_LIST[0],
         musicList:MUSIC_LIST,
         playModel:"order" //顺序播放
    };
  }

  playMusic(musicItem){
    console.log("musicItem",musicItem)
    $("#player").jPlayer("serMedia",{
      mp3:musicItem.file
    }).jPlayer("play");
    this.setState({
      currentMusicItem:musicItem
    })
  }

  playNext(type = "next"){
    let index = this.findMusicIndex(this.state.currentMusicItem) //当前播放歌曲位置
    let newIndex = null
    let musicListLength = this.state.musicList.length  //歌曲长度

    switch(type){
      case "prev" :
           newIndex = (index - 1 + musicListLength ) % musicListLength;
           break;
      case "loop":
            newIndex = index;
            break
      case 'order' :
                newIndex = (index + 1) % musicListLength;
                break;
      case 'random' :
            newIndex = Math.round(Math.random() * musicListLength);
            break;
      default:
            newIndex = (index + 1) % musicListLength
        }

        this.playMusic(this.state.musicList[newIndex])
    }
 // 当前播放音乐是第几首
    findMusicIndex(musicItem) {
        return this.state.musicList.indexOf(musicItem)
    }


    componentDidMount() {
        $('#player').jPlayer({
            supplied: 'mp3',
            wnode: 'window'
        })

        this.playMusic(this.state.currentMusicItem)

        // 监听音乐播放 如果播放完了播放下一曲
        $('#player').bind($.jPlayer.event.ended, () => {
            switch (this.state.playModel) {
                case 'loop':
                    this.playNext('loop');
                    break;
                case 'order' :
                    this.playNext('order');
                    break;
                case 'random' :
                    this.playNext('random');
                    break;
                default:
                    this.playNext('loop');

            }
        })


        // 选择歌曲
        Pubsub.subscribe('CHOOSE_MUSIC', (msg, musicItem) => {
            this.setState({
                currentMusicItem: musicItem
            });
            this.playMusic(musicItem)
        })

        // 删除歌曲
        Pubsub.subscribe('Delete_Item', (msg, musicItem) => {
            this.setState({
                musicList: this.state.musicList.filter((item) => {
                    return item !== musicItem
                })
            })

        })


        // 上一曲
        Pubsub.subscribe('preMusic', () => {
            this.playNext('prev')
        })


        // 下一曲

        Pubsub.subscribe('nextMusic', () => {
            this.playNext('next')
        })

        // 播放状态 ：顺序播放、单曲循环、随机播放
        Pubsub.subscribe('onceClick', () => {
            const playState = ['order', 'loop', 'random']
            let currentModel = playState.indexOf(this.state.playModel)
            let newModel = (currentModel + 1) % 3
            this.setState({
                playModel: playState[newModel]
            })

        })
    }

    componentWillUnmount() {
        Pubsub.unSubscribe('Select_Item');

        Pubsub.unSubscribe('Delete_Item');

        $('#player').unbind($.jPlayer.event.ended);

        Pubsub.unSubscribe('preMusic');
        Pubsub.unSubscribe('nextMusic');

        Pubsub.unSubscribe('onceClick');

  }
  render() {
    return (
       <Router>
         <div>
            <div id="player">
            </div>
            <Header/>
            <Route extact path="/" render={() =>
            (<player
               currentMusicItem={this.state.currentMusicItem}
               playModel={this.state.playmodel} 
            >
            </player>)}/>

            <Route path="/list" render={() => (
             <Musiclist
                 CurrentMusicItem={this.state.currentMusicItem}
                 MusicList={this.state.musicList}>
              </Musiclist>)}/>
         </div>

       </Router>     
    );
  }
}

export default App;
