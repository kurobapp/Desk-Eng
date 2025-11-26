// wordData と categoryList は data.js から読み込まれます

const labels = ["(ア)", "(イ)", "(ウ)", "(エ)"]; 

var app = { 
    mode: 'list', // 'list' or 'quiz'
    quizDirection: 'en_to_jp', // 'en_to_jp' or 'jp_to_en'
    category: '', // 初期値は空にしておく
    currentQuizIndex: 0,
    filteredQuestions: [],
    wrongQuestions: [],
    allEnglishWords: [], 
    allJapaneseAnswers: [], 
    allWords: [], 
    currentKeydownHandler: null, // ★追加: キーイベントの参照を保持

    cleanText: function(text) {
        if (!text) return '';
        return text.replace(/\^\^.*?\^\^/g, '').trim(); 
    },

    init: function() {
        this.allWords = [...wordData]; 
        this.allEnglishWords = this.allWords.map(q => q.q); 
        this.allJapaneseAnswers = this.allWords.map(q => this.cleanText(q.ans_j)); 

        this.generateCategoryMenu();
        
        // ■ 修正箇所: data.jsの先頭カテゴリを自動選択するように変更
        // これならdata.jsのIDが 'S1' 以外になっても大丈夫です
        const firstCategoryKey = Object.keys(categoryList)[0];
        this.selectCategory(firstCategoryKey);
        
        this.setDirection('en_to_jp'); 
        this.setMode('list'); 
        
        // ★追加: ページが閉じられる前にキーイベントリスナーを削除する
        window.addEventListener('beforeunload', this.cleanup.bind(this));
    },

    // ★追加: クリーンアップ関数
    cleanup: function() {
        if (this.currentKeydownHandler) {
            document.removeEventListener('keydown', this.currentKeydownHandler);
            this.currentKeydownHandler = null;
        }
    },

    setDirection: function(dir) {
        this.quizDirection = dir;
        
        document.querySelectorAll('.direction-selector .mode-btn').forEach(b => {
             if (b) b.classList.remove('active');
        });
        
        const htmlId = `dir-${dir.replace(/_/g, '-')}`; 
        const activeBtn = document.getElementById(htmlId);
        if (activeBtn) { 
            activeBtn.classList.add('active');
        } 
        
        this.resetQuizData();
        this.render();
    },

    generateCategoryMenu: function() {
        const select = document.getElementById('category-select');
        select.innerHTML = ''; 
        for (const [key, value] of Object.entries(categoryList)) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.text = value;
            select.appendChild(opt);
        }
    },

    setMode: function(mode) {
        this.mode = mode;
        
        document.querySelectorAll('.mode-selector .mode-btn').forEach(b => {
             if (b) b.classList.remove('active');
        });
        
        const activeBtn = document.getElementById(`mode-${mode}`);
        if (activeBtn) { 
            activeBtn.classList.add('active');
        }
        
        this.resetQuizData();
        this.render();
    },

    selectCategory: function(cat) {
        this.category = cat;
        const selectElement = document.getElementById('category-select');
        if(selectElement) {
            selectElement.value = cat; 
        }
        this.resetQuizData();
        this.render();
    },

    resetQuizData: function(customList = null) {
        this.currentQuizIndex = 0;
        this.wrongQuestions = [];

        if (customList) {
            this.filteredQuestions = [...customList];
        } else {
            if (this.category === 'all') {
                this.filteredQuestions = [...this.allWords];
            } else {
                this.filteredQuestions = this.allWords.filter(q => q.cat === this.category);
            }
        }
        
        if (this.mode === 'quiz' || customList) {
            this.shuffle(this.filteredQuestions);
        }
    },

    shuffle: function(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    render: function() {
        const container = document.getElementById('main-content');
        if (!container) return; 

        container.innerHTML = '';
        window.scrollTo(0,0);
        
        // ★追加: render時に既存のキーイベントリスナーを削除
        if (this.currentKeydownHandler) {
            document.removeEventListener('keydown', this.currentKeydownHandler);
            this.currentKeydownHandler = null;
        }

        if (this.filteredQuestions.length === 0) {
            container.innerHTML = '<p style="text-align:center;">このカテゴリに問題はありません。</p>';
            return;
        }

        if (this.mode === 'list') {
            this.renderListView(container);
        } else {
            this.renderQuizView(container);
        }
    },

    renderListView: function(container) {
        this.filteredQuestions.forEach((q, i) => {
            const card = document.createElement('div');
            card.className = 'question-card';
            
            const isEnToJp = (this.quizDirection === 'en_to_jp');
            const quizText = isEnToJp ? q.q : this.cleanText(q.ans_j); 
            const rawAnswerText = isEnToJp ? this.cleanText(q.ans_j) : q.q; 
            
            card.innerHTML = `
                <div class="q-header"><span>No. ${i + 1}</span> <span>ID: ${q.id}</span></div>
                <div class="q-text" style="color: ${isEnToJp ? '#2563eb' : '#d946ef'};">
                    ${isEnToJp ? '【英】' : '【日】'} ${quizText}
                </div>
                <details>
                    <summary>${isEnToJp ? '日本語訳' : '英単語'} / 例文を見る</summary>
                    <div class="ans-text" style="color: ${isEnToJp ? '#d946ef' : '#2563eb'};">${rawAnswerText}</div>
                    <div class="ans-example" style="font-size:0.9em; margin-top:5px; color:#64748b;">${q.example}</div>
                </details>
            `;
            container.appendChild(card);
        });
    },

    generateQuizOptions: function(correctText, allSourceArray) {
        const options = [correctText];
        const pool = allSourceArray.filter(item => item !== correctText);
        
        let tempPool = [...pool];
        while (options.length < 4) {
            if (tempPool.length === 0) {
                 const allOptionsExceptCorrect = allSourceArray.filter(item => item !== correctText);
                 tempPool = allOptionsExceptCorrect;
            }
            const randomIndex = Math.floor(Math.random() * tempPool.length);
            const candidate = tempPool[randomIndex];
            if (!options.includes(candidate)) {
                options.push(candidate);
            }
            tempPool.splice(randomIndex, 1);
        }
        
        this.shuffle(options); 
        const correctIndex = options.findIndex(opt => opt === correctText);
        
        return {
            opts: options,
            ans: correctIndex
        };
    },

    renderQuizView: function(container) {
        const q = this.filteredQuestions[this.currentQuizIndex];
        const total = this.filteredQuestions.length;
        
        const isEnToJp = (this.quizDirection === 'en_to_jp');
        let quizText = "";
        
        if (isEnToJp) {
            quizText = q.q; 
        } else {
            quizText = this.cleanText(q.ans_j); 
        }

        const card = document.createElement('div');
        card.className = 'question-card';
        card.innerHTML = `
            <div class="q-header">
                <span>問題 ${this.currentQuizIndex + 1} / ${total}</span>
                <span>Session: ${q.cat}</span>
            </div>
            <div class="q-text" style="color: ${isEnToJp ? '#2563eb' : '#d946ef'};">
                 ${isEnToJp ? '【英】' : '【日】'} ${quizText}
            </div>
            <div id="quiz-area"></div>
            <div id="result-msg" class="result-msg"></div>
            <div class="quiz-nav">
                <button class="btn btn-secondary" onclick="app.prevQuiz()" ${this.currentQuizIndex === 0 ? 'disabled' : ''}>前へ</button>
                <button id="btn-next" class="btn btn-next" onclick="app.nextQuiz()" disabled>次へ</button>
            </div>
        `;
        container.appendChild(card);
        const area = card.querySelector('#quiz-area');

        if (isEnToJp) {
            // ■ 英→日: 4択ボタン
            const correctText = this.cleanText(q.ans_j);
            const quizOptions = this.generateQuizOptions(correctText, this.allJapaneseAnswers);
            
            quizOptions.opts.forEach((opt, idx) => {
                const btn = document.createElement('button');
                btn.className = 'quiz-option';
                btn.textContent = `${labels[idx]} ${opt}`;
                btn.onclick = () => this.checkChoiceAnswer(btn, idx, quizOptions.ans, q); 
                area.appendChild(btn);
            });

        } else {
            // ■ 日→英: テキスト入力
            const inputWrapper = document.createElement('div');
            inputWrapper.style.marginBottom = '15px';
            inputWrapper.innerHTML = `
                <input type="text" id="answer-input" placeholder="英単語を入力..." autocomplete="off" 
                    style="width:100%; padding:12px; font-size:1.2rem; border:2px solid #ccc; border-radius:8px;">
                <button id="btn-submit" class="btn" style="width:100%; margin-top:10px; background:#2563eb;">回答する</button>
            `;
            area.appendChild(inputWrapper);

            const input = inputWrapper.querySelector('#answer-input');
            const submitBtn = inputWrapper.querySelector('#btn-submit');
            
            const submitHandler = () => {
                const val = input.value.trim();
                if(!val) return; 
                this.checkTypeAnswer(val, q, input, submitBtn);
            };

            submitBtn.onclick = submitHandler;
            
            // ★修正・追加: キーイベントをkeydownに変更し、回答時と次へ進む時（Enter/Space）を処理
            const keydownHandler = (e) => {
                const isEnterOrSpace = (e.key === 'Enter' || e.key === ' '); // スペースキーも追加
                
                if (isEnterOrSpace) {
                    e.preventDefault(); // デフォルトの動作（フォーム送信、スクロール）を防止
                    
                    // 1. 回答前: 回答を送信
                    if (!input.disabled) {
                        submitHandler();
                    } 
                    // 2. 回答後: 次の問題へ進む
                    else {
                        const nextBtn = document.getElementById('btn-next');
                        if (nextBtn && !nextBtn.disabled) {
                            this.nextQuiz();
                        }
                    }
                }
            };

            // ページ全体のキー入力を監視
            document.addEventListener('keydown', keydownHandler);
            this.currentKeydownHandler = keydownHandler; // 参照を保持
            
            setTimeout(() => input.focus(), 100);
        }
    },

    checkChoiceAnswer: function(btn, selectedIdx, correctIdx, questionObj) {
        if (document.querySelector('.quiz-option.correct') || document.querySelector('.quiz-option.wrong')) return;

        const opts = document.querySelectorAll('.quiz-option');
        const correctAnsText = this.formatResultText(questionObj);

        if (selectedIdx === correctIdx) {
            btn.classList.add('correct');
            this.showResultMsg(true, correctAnsText);
        } else {
            btn.classList.add('wrong');
            opts[correctIdx].classList.add('correct');
            this.showResultMsg(false, correctAnsText);
            this.wrongQuestions.push(questionObj);
        }
        document.getElementById('btn-next').disabled = false;
    },

    checkTypeAnswer: function(userVal, questionObj, inputElem, submitBtn) {
        if (inputElem.disabled) return;
        
        inputElem.disabled = true; 
        submitBtn.style.display = 'none'; 
        
        const correctVal = questionObj.q.trim();
        const correctAnsText = this.formatResultText(questionObj);
        
        if (userVal.toLowerCase() === correctVal.toLowerCase()) {
            inputElem.style.borderColor = '#22c55e';
            inputElem.style.backgroundColor = '#dcfce7';
            this.showResultMsg(true, correctAnsText);
        } else {
            inputElem.style.borderColor = '#ef4444';
            inputElem.style.backgroundColor = '#fee2e2';
            this.showResultMsg(false, correctAnsText);
            this.wrongQuestions.push(questionObj);
        }
        document.getElementById('btn-next').disabled = false;
    },

    formatResultText: function(q) {
        const actualCorrectWord = q.q; 
        const actualCorrectJapanese = this.cleanText(q.ans_j);
        const example = q.example.replace(/\(.+\)/g, '').trim();
        return `<strong>${actualCorrectWord} / ${actualCorrectJapanese}</strong><br><span style="font-size:0.9em; font-weight:normal;">例文: ${example}</span>`;
    },

    showResultMsg: function(isCorrect, text) {
        const msg = document.getElementById('result-msg');
        if (isCorrect) {
            msg.innerHTML = `🙆‍♂️ 正解！<br>正解単語: ${text}`;
            msg.style.backgroundColor = "#dcfce7";
            msg.style.color = "#166534";
        } else {
            msg.innerHTML = `🙅‍♀️ 不正解...<br>正解単語: ${text}`;
            msg.style.backgroundColor = "#fee2e2";
            msg.style.color = "#991b1b";
        }
        msg.style.display = "block";
    },
    
    nextQuiz: function() {
        if (this.currentQuizIndex < this.filteredQuestions.length - 1) {
            this.currentQuizIndex++;
            this.render();
        } else {
            this.renderResultView();
        }
    },

    prevQuiz: function() {
        if (this.currentQuizIndex > 0) {
            this.currentQuizIndex--;
            this.render();
        }
    },
    
    renderResultView: function() {
        const container = document.getElementById('main-content');
        if (!container) return; 
        
        // ★追加: render時に既存のキーイベントリスナーを削除
        if (this.currentKeydownHandler) {
            document.removeEventListener('keydown', this.currentKeydownHandler);
            this.currentKeydownHandler = null;
        }

        const total = this.filteredQuestions.length;
        const uniqueWrongIds = new Set(this.wrongQuestions.map(q => q.id));
        const wrongCount = uniqueWrongIds.size;
        const correctCount = total - wrongCount;
        
        let msg = "";
        if (correctCount === total) msg = "素晴らしい！全問正解です🎉";
        else if (correctCount >= total * 0.8) msg = "おしい！あと少し！👍";
        else msg = "復習して再チャレンジしましょう💪";

        const retryWrongBtn = wrongCount > 0 
            ? `<button class="btn btn-retry-wrong" onclick="app.retryWrong()">🔄 間違えた問題のみ (${wrongCount}問)</button>` 
            : '';

        container.innerHTML = `
            <div class="question-card result-container">
                <h2>テスト終了！</h2>
                <div class="score-text">${correctCount} / ${total} 問 正解</div>
                <p>${msg}</p>
                <div class="result-actions">
                    <button class="btn btn-retry-all" onclick="app.retryAll()">🔄 もう一度 (全問ランダム)</button>
                    ${retryWrongBtn}
                    <button class="btn btn-home" onclick="app.selectCategory('all'); app.setMode('list'); app.setDirection('en_to_jp');">🏠 一覧に戻る</button>
                </div>
            </div>
        `;
    },

    retryAll: function() {
        this.resetQuizData();
        this.render();
    },

    retryWrong: function() {
        const uniqueWrongQuestions = Array.from(new Set(this.wrongQuestions.map(q => q.id)))
            .map(id => this.allWords.find(q => q.id === id));
        
        this.resetQuizData(uniqueWrongQuestions);
        this.render();
    }
};

window.onload = function() {
    app.init();
};