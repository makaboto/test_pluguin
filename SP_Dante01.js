/*:ja
 * @plugindesc ダンテ立ち絵の表示＆管理プラグイン
 * @author まかぼと
 *
 *
 *@help
 *＊＊＊プラグインコマンド＊＊＊
 *プラグインコマンド
 *SP 表示 [キャラ名] [表情指定] [位置]
 *立ち絵を表示する。
 *位置には右、左、中央が入る。
 *全てのパラメータは省略できない。
 *
 *SP 話者交代 [位置]
 *表情を変えずに話者のみを変える時。
 *位置には[右、左、中央、全部、沈黙]が入る。
 *選択された位置の立ち絵以外が暗くなる。
 *全部にすると、立ち絵が全員明るくなる。一斉に発言した時に。
 *沈黙にすると、全員暗くなる。地の文などにどうぞ。
 *
 *SP 消去 [位置]
 *その位置(に割り振られたピクチャ番号)の立ち絵を消す
 *位置には右、左、中央、全部が入る。
 *ここの全部は、立ち絵全部消去の全部。
 *
 *必ずPictureAnimation-Alter.jsと同時に入れてください！！
 */

 /*:
 * @plugindesc StandPose Picture Show!
 * @author MaKaBoTo
 *PluginCommand
 *SP show [Character Name] [Facial expression] [Character Position]
 *Character Display
 *
 *SP change [Character Position]
 *Character focus change
 *Character Position is right,left,center,all,silence.
 *
 *SP delete [Character Position]
 *Character Picture delete
 *
 */
//ここまでヘルプ
//下から処理

//===============================================
// 処理
//===============================================

 (function(){

     'use strict';
     var pluginName = "SP_Dante01";

    //=============================================================================
    // プラグインパラメータの取得と整形
    //=============================================================================

    var getParamString = function(paramNames) {
      if (!Array.isArray(paramNames)) paramNames = [paramNames];
      for (var i = 0; i < paramNames.length; i++) {
          var name = PluginManager.parameters(pluginName)[paramNames[i]];
          if (name) return name;
      }
      return '';
    };
    var getParamNumber = function(paramNames, min, max) {
      var value = getParamString(paramNames);
      if (arguments.length < 2) min = -Infinity;
      if (arguments.length < 3) max = Infinity;
      return (parseInt(value) || 0).clamp(min, max);
    };

      var parameters = PluginManager.parameters(pluginName);
      var param_array_variable = getParamNumber('ArrayVariable'); //情報格納


     //===============================================
     // プラグインコマンドの定義
     //===============================================

     var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
     Game_Interpreter.prototype.pluginCommand = function(command, args){
          _Game_Interpreter_pluginCommand.call(this, command, args);
          // [SP 表示 キャラ名 表情指定 位置]
          // プラグインコマンドの条件分岐
          if(command === pluginName){
                switch(args[0]){
                case '表示':
                case 'show':
                    commandSP_show(args[1],args[2],args[3]);
                    //args[0]の中身がshowならば、
                    //commandSP_show関数を起動せよ 引数はargs[1](キャラ名）と表情(args[2])と位置[args[3]]を渡す
                    break;

                case '話者交代':
                case 'change':
                    commandSP_FocusChange(args[1])
                    //args[2](表示位置の情報)を引数として関数SP_FocusChangeにわたす。
                    break;

                case '消去':
                case 'delete':
                    commandSP_Delete(args[1])
                    //commandSP_show
                    //args[1](表示位置の情報)を引数として関数SP_deleteにわたす。


                case '移動':
                case 'move':
                    commandSP_PositionMove(args[1],args[2])
                    //args[1](移動前)、args[2]（移動先）
                    break;


              }  //switchカッコ
           }  //
       };

    // Game_Interpreter.prototype.pluginCommandの〆



    // **********************************************************************************
    // linkscapeより
    // 1:関数は入れ子にしすぎない
    // 2:何度も使うPostionをセットするのは関数にまとめる
    // 3: if-else文は
    //    if(true){
    //        hoge()
    //    }else if(true){
    //        fuga()
    //    }
    //   のように、処理だけ書く行とif,elseの制御を行う行は分ける
    // 4:
    // 5:
    //---------------------------------------------------
    //te処理
    //-----------------------------------------
    // [定数]
    // 位置ごとにx yを格納
    //-----------------------------------------
        const  SP_x = {'left':-40, 'center':240, 'right':480};
        const  SP_y = {'left':0, 'center':0, 'right':0};
        const  SP_Change_Wait = 5
        const  NonFocus = [-70,-70,-70,0]

        const  Name_picNo = 61;
        const  NamePlate_x = 0;
        const  NamePlate_y = 400;
    //-------------------------------
    // [定数] ピクチャ番号の決定
    //  picture_hogehoge_Id (表示位置によって違う)
    //-------------------------------
        const  picture_Base_Id = {'left':30, 'center':40, 'right':50};
        const  picture_Face_Id = {'left':31, 'center':41, 'right':51};
        const  picture_Blink_Id = {'left':32, 'center':42, 'right':52};

    //　base(のっぺらぼう)→face(表情)→blnk(まばたきアニメーション)の順に表示
    //---------------------------------------
    // **********************************************************************************
 



     //Postionを返す関数
     var setPosition = function(pc_Position){
            var Position
            switch (pc_Position) {
                case "右":
                case "right":
                     Position = 'right'
                     break;

                 case "左":
                 case "left":
                     Position = 'left'
                     break;

                case "中央":
                case "center":
                     Position = 'center'
                     break;
                default:
            }
            return Position;
     }

    var setTalker = function(pc_Position){
          var Position
          switch (pc_Position) {
              case "右":
              case "right":
                    Position = 'right'
                    break;
              case "左":
              case "left":
                   Position = 'left'
                   break;
              case "中央":
              case "center":
                    Position = 'center'
                    break;
              case "全部":
              case "all":
                    Position = 'all'
                    break;
              case "沈黙":
              case "silence":
                    Position = 'silence'
                    break;
              default:
          }
          return Position;
     }

    //===============================================
    // 【commandSP_Show】
    // 　立ち絵表示のための関数
    //===============================================
     function commandSP_show(pc_CharaName, pc_Chara_Expression, pc_Position){

        //--※注釈---------------
        // pc_CharaName　キャラ名
        // pc_Chara_Expression　表情　
        // pc_Position位置
        //-----------------------

        //==============================
        // 表示位置ごとに分岐して処理
        //==============================

        var Position = setPosition(pc_Position)
        //　if関数の中で[var Ppsition ='right']とかしてはいけない。
        //　ifという入れ子の中で生まれた変数は、そのスコープ内でしか使えない…
        //  つまり、if以降の処理に持っていく事ができないのだ。
        //ここにPositionに入った文字列が、連想配列の値のアクセスのキー名になる


        //===============================================
         //キャラクターごとの分岐 (関数commandSP_Showの続き)
        //===============================================

        // [SP 表示 キャラ名 表情指定 位置]
        if(pc_CharaName== "アゲハ"){
            $gameScreen.showPicture(picture_Base_Id[Position],'SP-Ageha_base',0,
            SP_x[Position], SP_y[Position], 100, 100, 255, 0)
            // SP-Kure_base.pngを表示
            $gameScreen.showPicture(picture_Face_Id[Position],'SP-Ageha_'+pc_Chara_Expression,0,SP_x[Position], SP_y[Position], 100, 100, 255, 0)
            

            //名札表示も同時に行う

            $gameScreen.showPicture(Name_picNo,'Window-nameplate-Ageha',0,NamePlate_x, NamePlate_y, 100, 100, 0, 0)
        }
        //else if (true) {
        //
        //}

        //-----まばたきの関数を呼び出す。引数としてキャラ名、キャラ表情、表示位置を渡す。-----------------
        commandexSP_Blink(picture_Face_Id[Position],pc_CharaName,pc_Chara_Expression,pc_Position);

    }




    //===============================================
    // 入れ子【commandexSP_Blink】
    // 処理本体　関数start
    //===============================================
    function commandexSP_Blink(pictureId,pc_CharaName,pc_Chara_Expression,pc_Position){
        var Position = setPosition(pc_Position)


        //-------------------------------------------//
        // アニメーション準備のプラグインコマンドを送信  //
        //【カスタマイズ推奨】                         //
        //-------------------------------------------//
        // なんで+1せなあかんのかわからん
        var command_INIT = ['PA_INIT',pictureId+1,3,7,'連番','0'];
        //プラグインコマンドの内容。
        //3枚の画像で、7ウェイトごとにアニメーション。セルは連番画像。


        var command_INITs = command_INIT.join( ' ' );
        CallPluginCommand(command_INITs);
        //======================================//
        // 【要カスタマイズ】まばたき              //
        // キャラクターの立ち絵ごとに設定          //
        // キャラ名分岐→表情でさらに分岐している   //
        //======================================//

        //=======================================================
        if(pc_CharaName== "アゲハ"){
            const Blink1 = ['00','02','04','08','09','10','11','12']//通常のまばたき

            //-------------------console---------------------------
            //console.log(Blink1.some((ao) => ao === pc_Chara_Expression))
            //console.log(Blink2.some((ao) => ao === pc_Chara_Expression))
            //console.log(Blink3.some((ao) => ao === pc_Chara_Expression))
            //console.log(Blink4.some((ao) => ao === pc_Chara_Expression))
            //------------------ここまで---------------------------

            if (Blink1.some((ao) => ao === pc_Chara_Expression)) {
                $gameScreen.showPicture(picture_Blink_Id[Position],'SP-Ageha_EYE01_00',0,SP_x[Position], SP_y[Position], 100, 100, 255, 0);
                commandBlink_START(Position)
            }else {
                commandBlink_STOP(Position)
                $gameScreen.erasePicture(picture_Blink_Id[Position])
                }

        //=======================================================
    }
    //－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－－


      // ....commandSP_Delete関数ここまで 【commandSP_Delete】//



}

  //=======================================
    //　【commandBlink_START】（commandexSP_Blinkの中の関数）
    //　ループアニメーション再生コマンド  【カスタマイズ推奨】  //
    //=======================================================
    function commandBlink_START(Position){
        var command_BSTART = ['PA_START_LOOP',picture_Blink_Id[Position],3,[1,1,1,1,2,3,1,1,1,1,2,3,1,1,1,1,1,1,1,2,3,1,1,1,1,1,1]];
        //　PA_START_LOOP (まばたき用ピクチャID 3(連番) [配列でアニメーション順を設定]
        var command_BSTARTs = command_BSTART.join( ' ' );
        //join関数で半角スペースで文字列を連結する。
        CallPluginCommand(command_BSTARTs);
        //連結したものを送信する。
    }
    //=======================================

    //=======================================
    //　【commandBlink_STOP】（commandexSP_Blinkの中の関数）
    //　アニメーション停止のプラグインコマンドを飛ばす
    //=======================================
    function commandBlink_STOP(Position){
        var command_BSTOP = ['PA_STOP',picture_Blink_Id[Position]];
        var command_BSTOPs = command_BSTOP.join( ' ' );
        CallPluginCommand(command_BSTOPs);
        clearInterval(command_BSTOPs)
    }
    // ....commandexSP_Blink関数ここまで 【commandexSP_Blink】//


    //===============================================
    // 【commandSP_FocusChange】
    // 　選んだ位置を話す人として、その立ち絵を明るく、
    //　 逆の位置の立ち絵を暗くする関数
    //===============================================

    function commandSP_FocusChange(pc_Position){
        var Position = setTalker(pc_Position)
        // if関数の外で変数宣言をしておく。

        switch (Position) {
            case "all":
                //全員の立ち絵を明るくする
                $gameScreen.tintPicture(picture_Base_Id.right, [0,0,0,0], SP_Change_Wait);
                $gameScreen.tintPicture(picture_Face_Id.right, [0,0,0,0], SP_Change_Wait);
                $gameScreen.tintPicture(picture_Blink_Id.right, [0,0,0,0], SP_Change_Wait);

                $gameScreen.tintPicture(picture_Base_Id.left, [0,0,0,0], SP_Change_Wait);
                $gameScreen.tintPicture(picture_Face_Id.left, [0,0,0,0], SP_Change_Wait);
                $gameScreen.tintPicture(picture_Blink_Id.left, [0,0,0,0], SP_Change_Wait);

                $gameScreen.tintPicture(picture_Base_Id.center, [0,0,0,0], SP_Change_Wait);
                $gameScreen.tintPicture(picture_Face_Id.center, [0,0,0,0], SP_Change_Wait);
                $gameScreen.tintPicture(picture_Blink_Id.center, [0,0,0,0], SP_Change_Wait);
                break;

            case "center":
                $gameScreen.tintPicture(picture_Base_Id.center, [0,0,0,0], SP_Change_Wait);
                $gameScreen.tintPicture(picture_Face_Id.center, [0,0,0,0], SP_Change_Wait);
                $gameScreen.tintPicture(picture_Blink_Id.center,[0,0,0,0], SP_Change_Wait);

                $gameScreen.tintPicture(picture_Base_Id.right, NonFocus, SP_Change_Wait);
                $gameScreen.tintPicture(picture_Face_Id.right, NonFocus, SP_Change_Wait);
                $gameScreen.tintPicture(picture_Blink_Id.right, NonFocus, SP_Change_Wait);

                $gameScreen.tintPicture(picture_Base_Id.left, NonFocus, SP_Change_Wait);
                $gameScreen.tintPicture(picture_Face_Id.left, NonFocus, SP_Change_Wait);
                $gameScreen.tintPicture(picture_Blink_Id.left, NonFocus, SP_Change_Wait);
                break;

            case "left":
                $gameScreen.tintPicture(picture_Base_Id.left, [0,0,0,0], SP_Change_Wait);
                $gameScreen.tintPicture(picture_Face_Id.left, [0,0,0,0], SP_Change_Wait);
                $gameScreen.tintPicture(picture_Blink_Id.left, [0,0,0,0], SP_Change_Wait);

                $gameScreen.tintPicture(picture_Base_Id.right, NonFocus, SP_Change_Wait);
                $gameScreen.tintPicture(picture_Face_Id.right, NonFocus, SP_Change_Wait);
                $gameScreen.tintPicture(picture_Blink_Id.right, NonFocus, SP_Change_Wait);

                $gameScreen.tintPicture(picture_Base_Id.center,NonFocus, SP_Change_Wait);
                $gameScreen.tintPicture(picture_Face_Id.center, NonFocus, SP_Change_Wait);
                $gameScreen.tintPicture(picture_Blink_Id.center, NonFocus, SP_Change_Wait);
                break;
            case "right":
                $gameScreen.tintPicture(picture_Base_Id.right, [0,0,0,0], SP_Change_Wait);
                $gameScreen.tintPicture(picture_Face_Id.right, [0,0,0,0], SP_Change_Wait);
                $gameScreen.tintPicture(picture_Blink_Id.right, [0,0,0,0], SP_Change_Wait);

                $gameScreen.tintPicture(picture_Base_Id.left, NonFocus, SP_Change_Wait);
                $gameScreen.tintPicture(picture_Face_Id.left, NonFocus, SP_Change_Wait);
                $gameScreen.tintPicture(picture_Blink_Id.left, NonFocus, SP_Change_Wait);

                $gameScreen.tintPicture(picture_Base_Id.center, NonFocus, SP_Change_Wait);
                $gameScreen.tintPicture(picture_Face_Id.center, NonFocus, SP_Change_Wait);
                $gameScreen.tintPicture(picture_Blink_Id.center, NonFocus, SP_Change_Wait);
                break;
            case "silence":
                //全員が沈黙。全員が暗くなる。
                $gameScreen.tintPicture(picture_Base_Id.right, NonFocus, SP_Change_Wait);
                $gameScreen.tintPicture(picture_Face_Id.right, NonFocus, SP_Change_Wait);
                $gameScreen.tintPicture(picture_Blink_Id.right, NonFocus, SP_Change_Wait);

                $gameScreen.tintPicture(picture_Base_Id.left, NonFocus, SP_Change_Wait);
                $gameScreen.tintPicture(picture_Face_Id.left, NonFocus, SP_Change_Wait);
                $gameScreen.tintPicture(picture_Blink_Id.left, NonFocus, SP_Change_Wait);

                $gameScreen.tintPicture(picture_Base_Id.center, NonFocus, SP_Change_Wait);
                $gameScreen.tintPicture(picture_Face_Id.center, NonFocus, SP_Change_Wait);
                $gameScreen.tintPicture(picture_Blink_Id.center,NonFocus, SP_Change_Wait);
                break;
        }
    }
    //----------------------------------------------------------------

//＝＝＝＝＝＝＝＝＝＝【ここから追加】＝＝＝＝＝＝＝＝＝＝

    //===============================================
    // 【commandSP_PositionMove】
    // 　立ち絵を移動する関数
    //===============================================

function commandSP_PositionMove(BeforePosition,AfterPosition){

var BP = setPosition(BeforePosition)
var AP = setPosition(AfterPosition)
var move_wait = 60

$gameScreen.movePicture(picture_Base_Id[BP],0,SP_x[AP], SP_y[AP], 100, 100, 255, 0,move_wait)
$gameScreen.movePicture(picture_Face_Id[BP],0,SP_x[AP], SP_y[AP], 100, 100, 255, 0,move_wait)
$gameScreen.movePicture(picture_Blink_Id[BP],0,SP_x[AP], SP_y[AP], 100, 100, 255, 0,move_wait)



$gameScreen.shiftPicture(BP,AP)
//ピクチャ番号の入れ替え作業

              $gameScreen.erasePicture(picture_Base_Id[BP])
              $gameScreen.erasePicture(picture_Face_Id[BP])
              $gameScreen.erasePicture(picture_Blink_Id[BP])


//-----
}



    //===============================================
    // 【Game_Screen.shiftPicture】
    // 　立ち絵のピクチャ番号入れ替えるやつ
    //===============================================

Game_Screen.prototype.shiftPicture = function(BP,AP) {

var from_Id_Base = picture_Base_Id[BP]
var to_Id_Base = picture_Base_Id[AP]

var from_Id_Face = picture_Face_Id[BP]
var to_Id_Face = picture_Face_Id[AP]

var from_Id_Blink = picture_Face_Id[BP]
var to_Id_Blink = picture_Face_Id[AP]

//　立ち絵が移動前・移動先のピクチャIDを取得

    var real_fromId_Base = this.realPictureId(from_Id_Base);
    var real_toId_Base = this.realPictureId(to_Id_Base);

    var real_fromId_Face = this.realPictureId(from_Id_Face);
    var real_toId_Face = this.realPictureId(to_Id_Face);

    var real_fromId_Blink = this.realPictureId(from_Id_Blink);
    var real_toId_Blink = this.realPictureId(to_Id_Blink);

    this._pictures[real_toId_Base]　= (this._pictures[real_fromId_Base]);
    this._pictures[real_toId_Face]　= (this._pictures[real_fromId_Face]);
    this._pictures[real_toId_Blink]　= (this._pictures[real_fromId_Blink]);
}


//＝＝＝＝＝＝＝＝＝＝【ここまで追加】＝＝＝＝＝＝＝＝＝＝



    //===============================================
    // 【commandSP_Delete】
    // 　立ち絵を消去する関数
    //===============================================
    function commandSP_Delete(pc_Position){
        var Position = setTalker(pc_Position)
        if (Position == 'all') {
              //全部の位置が対象の時。問答無用で消えていただく。
              $gameScreen.erasePicture(picture_Base_Id.right)
              $gameScreen.erasePicture(picture_Face_Id.right)
              $gameScreen.erasePicture(picture_Blink_Id.right)

              $gameScreen.erasePicture(picture_Base_Id.left)
              $gameScreen.erasePicture(picture_Face_Id.left)
              $gameScreen.erasePicture(picture_Blink_Id.left)

              $gameScreen.erasePicture(picture_Base_Id.center)
              $gameScreen.erasePicture(picture_Face_Id.center)
              $gameScreen.erasePicture(picture_Blink_Id.center)
          } else {
              //対象の位置が「全部」でない時、個別に消す。
              $gameScreen.erasePicture(picture_Base_Id[Position])
              $gameScreen.erasePicture(picture_Face_Id[Position])
              $gameScreen.erasePicture(picture_Blink_Id[Position])

          }

    }




 })();
