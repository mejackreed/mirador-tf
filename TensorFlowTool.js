import React, { Component, Fragment } from 'react';
import Mirador from 'mirador/dist/es/src/index.js';
import ManifestoCanvas from 'mirador/dist/es/src/lib/ManifestoCanvas';
import { MiradorMenuButton } from 'mirador/dist/es/src/components/MiradorMenuButton';
import SentimentVerySatisfiedIcon from '@material-ui/icons/SentimentVerySatisfied';
import CircularProgress from '@material-ui/core/CircularProgress';
import uuid from 'uuid/v4';
import * as cocoSsd from '@tensorflow-models/coco-ssd'

class ButtonThing extends Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.state = {
      modelLoaded: false
    };    
  }

  componentDidMount() {
    if (!window.m3Model) {
      console.time('modelLoading');
      cocoSsd.load({
        base: 'mobilenet_v2'
      }).then((model) => {
        window.m3Model = model;
        this.setState({
          modelLoaded: true
        });
        console.timeEnd('modelLoading');
      });
    } else {
      this.setState({
        modelLoaded: true
      });
    }
  }

  /* https://stackoverflow.com/questions/46399223/async-await-in-image-loading */
  addImage(src) {
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject
      img.src = src;
    });
  }

  handleClick(e) {
    const { currentTarget } = e;
    const { receiveAnnotation, canvases } = this.props;
    const currentCanvasIds = canvases.map(canvas => canvas.id);
    canvases.map(canvas => {
      const manifestoCanvas = new ManifestoCanvas(canvas);
      const requestedWidth = 1024;
      const imgUrl = manifestoCanvas.canonicalImageUri().replace('full/full', `full/${requestedWidth},`);
      const sizeChange = requestedWidth / manifestoCanvas.imageResource.getWidth();
      const genUuid = uuid();
      const annoListId = `${canvas.id}/${genUuid}/annoList`;

      this.addImage(imgUrl).then(img => {
        window.m3Model.detect(img).then(predictions => {
          console.timeEnd('prediction');
          console.log(predictions);
          const resources = predictions.map((prediction, index) => {
            let [x, y, w, h] = prediction.bbox;
            x = x / sizeChange;
            w = w / sizeChange;
            y = y / sizeChange;
            h = h / sizeChange;
            return {
              '@id': `${canvas.id}/${genUuid}/${index}`,
              '@type': 'oa:Annotation',
              motivation: ['oa:commenting'],
              on: {
                '@type': 'oa:SpecificResource',
                full: canvas.id,
                selector: {
                  '@type': 'oa:FragmentSelector',
                  value: `xywh=${x},${y},${w},${h}`
                }
              },
              resource: [
                {
                  chars: `${prediction.class} - ${prediction.score}`
                }
              ]
            }
          });
          const annoList = {
            '@id': annoListId,
            '@type': 'sc:AnnotationList',
            resources: resources,
          }

          receiveAnnotation(canvas.id, annoListId, annoList)
        });
      });
    });
  }

  render() {
    const { modelLoaded } = this.state;
    let button;
    if (modelLoaded) {
      button = (
        <MiradorMenuButton
          aria-label="Do the stuff"
          onClick={this.handleClick}
        >
         <SentimentVerySatisfiedIcon/>
       </MiradorMenuButton>
     )
   } else {
     button = <CircularProgress />
   }
    
    return (
      <Fragment>
        {button}
     </Fragment>
    )
  }
}

class TensorFlowTool extends Component {
  render() {
    const { TargetComponent, targetProps, receiveAnnotation, canvases } = this.props;

    return (
      <Fragment>
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          <ButtonThing
            receiveAnnotation={receiveAnnotation}
            canvases={canvases}
          />
        </div>
        <TargetComponent {...targetProps} />
      </Fragment>
    )
  }
}

const mapDispatchToProps = {
  receiveAnnotation: Mirador.actions.receiveAnnotation
};

function mapStateToProps(state, { targetProps }) {
  return {
    canvases: Mirador.selectors.getSelectedCanvases(state, { windowId: targetProps.windowId }),
  };
};

export default {
  target: 'WindowCanvasNavigationControls',
  mode: 'wrap',
  component: TensorFlowTool,
  mapDispatchToProps,
  mapStateToProps,
};
