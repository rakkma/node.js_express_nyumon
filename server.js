const express = require("express");
const {engine} = require("express-handlebars");
const app = express();
const fileUpload = require("express-fileupload");
const PORT = 5000;
const mysql = require("mysql");

//アップロードを処理するために使用されるミドルウェア
app.use(fileUpload());

//Expressアプリケーションで静的ファイルの提供を行うためのミドルウェアの設定
app.use(express.static("upload"));
 //"upload"ディレクトリを見る

//ExpressアプリケーションでHandlebarsというテンプレートエンジンを使用するための設定
app.engine("handlebars", engine());
 //HandlebarsはJavaScriptのテンプレートエンジンの1つであり、可読性の高いテンプレートを作成し、動的なコンテンツの表示ができる

//ExpressアプリケーションでHandlebarsをテンプレートエンジンとして使用するための設定
app.set("view engine", "handlebars");
 //この設定により、Handlebarsファイル（拡張子が.handlebarsまたは.hbs）を自動的にテンプレートとして認識

//Expressアプリケーションでテンプレートファイルのビューディレクトリを設定
app.set("views", "./views");
 //この設定により、テンプレートエンジンが検索するディレクトリを指定。"./views"はテンプレートファイルが存在するディレクトリのパスを示す

//connection pool:MySQLデータベースへの接続プールを作成するための設定
//最初からデータベースに接続しておく
//プールを使って画像のファイル名を取得する
const pool = mysql.createPool({
  connectionLimit: 10, // 接続プール内の最大接続数を制限するための値
  host: "localhost", //データベースのホスト名またはIPアドレスを指定
  user: "user", //データベースに接続するためのユーザー名を指定
  database: "image-uploader", //使用するデータベースの名前を指定
  password: "user", //データベースに接続するためのパスワードを指定
});

//ルートURL (/) へのGETリクエストに対する処理を定義するためのルートハンドラー関数
//URLを入力してENTERを押したときの処理
app.get("/", function(req, res){
    //res.render("home"); //指定したビューテンプレートをレンダリングしてクライアントに送信
     //ここではhome.handlebarsをレンダリング

//MySQLデータベース接続プールから新しい接続を取得
    pool.getConnection(function(err, connection){ //書き方を知りたい場合mysql npmのドキュメントで確認
      if (err) throw err; //エラーが発生した場合にエラーオブジェクトをスロー（throw）してエラーを処理するためのコード
      console.log("DBと接続中・・・🌳");
      //MySQLデータベースに対してクエリを実行
      connection.query("SELECT * FROM image", function(err, rows){ //SELECT:取得する(SQL文) *:すべて image:データベース名 
         //クエリ（query）:ソフトウェアに対するデータの問い合わせや要求などを一定の形式で文字に表現することを意味する。 
         //クエリを通じて、データの検索や更新、削除、抽出などの要求をデータベース（DBMS）に送信することができる。

        connection.release(); //接続プールから接続を解放。接続プール:データベース接続の管理を効率化するための仕組み
        console.log(rows); //rows:クエリの結果として取得したデータの配列
         //rowsの中に画像に関するデータが入っている
        if (!err) { //もしエラーがなければ処理を実行
          //指定したビューテンプレートをレンダリング
          return res.render("home", { rows }); //{rows}でテンプレートエンジンにデータを渡せる
           //渡したものをhome.handlebarsで受け取る
        }
      });
    });
});

//POSTリクエストを処理するためのルートハンドラ（ミドルウェア）を設定
 //POSTリクエスト:HTTP通信でクライアント（Webブラウザなど）からWebサーバへ送るリクエストの種類の一つ
 //URLで指定したプログラムなどに対してクライアントからデータを送信するためのもの
app.post("/", function(req, res){
  console.log(req.files); //フォームでアップロードされたファイルの情報をコンソールに出力
  let sampleFile;
  let uploadPath;

  if (!req.files) { //!～で～がないときという意味
    return res.status(400).send("何も画像がアップロードされていません");
  }
  sampleFile = req.files.sampleFile; //フォームでアップロードされたファイルの情報を取得
  uploadPath = __dirname + "/upload/" + sampleFile.name; //__dirnameを使用して現在のスクリプトのディレクトリパスを取得
  // "/upload/"ディレクトリ内にアップロードされたファイルの名前を結合して、アップロード先のパスを作成
  //sampleFileという名前のファイルフィールドからアップロードされたファイルに関する情報を取得。ファイルフィールドの名前は、フォームのHTMLコードで指定された名前に対応
  //sampleFileは取得したファイル情報を格納するための変数。この変数には、アップロードされたファイルのプロパティ（例：名前、サイズ、一時的な保存先など）が含まれる
  console.log(sampleFile); 

    //サーバーに画像ファイルを置く場所の指定。画像ファイルを保存
  sampleFile.mv(uploadPath, function (err) {
  if (err) return res.status(500).send(err);
  // res.send("ファイルをアップロードしました！");
  });

  //MySQLに画像の名前を保存
  pool.getConnection(function(err, connection){ //書き方を知りたい場合mysql npmのドキュメントで確認
    if (err) throw err; //エラーが発生した場合にエラーオブジェクトをスロー（throw）してエラーを処理するためのコード
    console.log("DBと接続中・・・🌳");
    connection.query(`INSERT INTO image values ("", "${sampleFile.name}")`, function(err, rows){ //SELECT:取得する *:すべて image:データベース名 
    //クエリ（query）:ソフトウェアに対するデータの問い合わせや要求などを一定の形式で文字に表現することを意味する。 
    //クエリを通じて、データの検索や更新、削除、抽出などの要求をデータベース（DBMS）に送信することができる。

    connection.release(); //接続プールから接続を解放。接続プール:データベース接続の管理を効率化するための仕組み
      //console.log(rows); //rows:クエリの結果として取得したデータの配列
      //rowsの中に画像に関するデータが入っている
    if (!err) { //もしエラーがなければ処理を実行
      //指定したビューテンプレートをレンダリング
      res.redirect("/");//
      } else {
      console.log(err);
      }
    });
  });
});
  
//Expressアプリケーションを指定したポート番号で起動
app.listen(PORT, function(){
    console.log("サーバーが起動");
});