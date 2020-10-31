class VideoMediaPlayer {
  constructor({ manifestJSON, network, videoComponent }) {
    this.manifestJSON = manifestJSON;
    this.network = network;
    this.videoComponent = videoComponent;

    this.videoElement = null;
    this.sourceBuffer = null;
    this.selected = {};
    this.videoDuration = 0;
  }

  initializeCodec() {
    console.log('aqui');
    this.videoElement = document.getElementById("vid");
    const mediaSourceSupported = !!window.MediaSource;

    if (!mediaSourceSupported) {
      alert("Seu browser não tem suport a MSE");
      return;
    }

    const codecSupported = MediaSource.isTypeSupported(this.manifestJSON.codec);
    if (!codecSupported) {
      alert(`Seu browser não suporta o codec: ${this.manifestJSON.codec}`);
      return;
    }

    const mediaSource = new MediaSource();
    this.videoElement.src = URL.createObjectURL(mediaSource);
    console.log(this.videoElement.src);
    mediaSource.addEventListener(
      "sourceopen",
      this.sourceOpenWrapper(mediaSource)
    );
  }

  sourceOpenWrapper(mediaSource) {
    return async (_) => {
      this.sourceBuffer = mediaSource.addSourceBuffer(this.manifestJSON.codec);
      const selected = this.selected = this.manifestJSON.intro                                                                                                                                                                                                                                                                                                                                                                                                                                     ;

      // evita rodar como "LIVE"
      console.log(selected);
      mediaSource.duration = this.videoDuration;
      await this.fileDownload(selected.url);
      setInterval(this.waitForQuestions.bind(this), 200);
    };
  }

  waitForQuestions() {
    const currentTime = parseInt(this.videoElement.currentTime);
    console.log('currentTime', currentTime);
    this.videoComponent.configureModal(this.selected.options);
  }

  async fileDownload(url) {
    const prepareUrl = {
      url,
      fileResolution: 360,
      fileResolutionTag: this.manifestJSON.fileResolutionTag,
      hostTag: this.manifestJSON.hostTag,
    };
    const finalUrl = this.network.parseManifestURL(prepareUrl);
    this.setVideoPlayerDuration(finalUrl);
    const data = await this.network.fetchFile(finalUrl);
    return this.processBufferSegments(data);
  }

  setVideoPlayerDuration(finalURL) {
    const bars = finalURL.split("/");
    const [name, videoDuration] = bars[bars.length - 1].split("-");
    this.videoDuration += videoDuration;
  }

  async processBufferSegments(allSegments) {
    const sourceBuffer = this.sourceBuffer;
    sourceBuffer.appendBuffer(allSegments);

    return new Promise((resolve, reject) => {
      const updateend = (_) => {
        sourceBuffer.removeEventListener("updateend", updateend);
        sourceBuffer.timestampOffset = this.videoDuration;

        return resolve();
      };
      sourceBuffer.addEventListener("updateend", updateend);
      sourceBuffer.addEventListener("error", reject);
    });
  }
}
