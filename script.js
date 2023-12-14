class CanvasImage {
	constructor(canvas, src) {
		const ctx = canvas.getContext('2d');
		const i = new Image();
		const that = this;
		i.onload = function(){
			canvas.width = i.width;
			canvas.height = i.height;
			ctx.drawImage(i, 0, 0, i.width, i.height);
			that.original = that.getData();
			allGisto.render()
			redGisto.render()
			greenGisto.render()
			blueGisto.render()
		};
		i.src = src;
		this.ctx = ctx;
		this.image = i;
	}

	getData() {
		return this.ctx.getImageData(0, 0, this.image.width, this.image.height);
	};

	setData(data) {
		return this.ctx.putImageData(data, 0, 0);
	};

	reset() {
		this.setData(this.original);

		allGisto.render()
		redGisto.render()
		greenGisto.render()
		blueGisto.render()
	}

	getAvgBrightness() {
		const data = this.getData().data;
		const len = data.length;

		let sum = 0;
		let kol = 0;
		for (let i = 0; i < len; i += 4) {
			kol++;
			sum += getBrightness(data[i], data[i+1], data[i+2])
		}
		return sum / kol
	}

	transform(fn, factor) {
		const oldData = this.getData();
		const oldpx = oldData.data;
		const newdata = this.ctx.createImageData(oldData);
		const newpx = newdata.data
		let res = [];
		const len = newpx.length;
		for (let i = 0; i < len; i += 4) {
			res = fn.call(this, oldpx[i], oldpx[i+1], oldpx[i+2], oldpx[i+3], factor, i);
			newpx[i]   = res[0]; // r
			newpx[i+1] = res[1]; // g
			newpx[i+2] = res[2]; // b
			newpx[i+3] = res[3]; // a
		}
		this.setData(newdata);

		allGisto.render()
		redGisto.render()
		greenGisto.render()
		blueGisto.render()
	};
}

class Gisto {
	constructor(canvas, ci, fn, color = 'black') {
		this.ctx = canvas.getContext('2d');
		this.ci = ci
		this.fn = fn
		this.color = color
	}

	calc() {
		const data = this.ci.getData().data;

		const nums = new Array(256).fill(0)

		for (let i = 0; i < data.length; i += 4) {
			const res = this.fn.call(this, data[i], data[i+1], data[i+2]);
			nums[res] += 1;
		}

		return nums
	}

	render() {
		const res = this.calc()
		const len = this.ci.getData().data.length;
		this.ctx.strokeStyle = this.color;
		this.ctx.rect(0, 0, this.ctx.canvas.width,this.ctx.canvas.height )
		this.ctx.fillStyle = 'white'
		this.ctx.fill()

		res.forEach((n, i) => {
			const x = (i / 256) * this.ctx.canvas.width;
			const h = (n / len) * this.ctx.canvas.height * 100

			this.ctx.beginPath();
			this.ctx.moveTo(x, this.ctx.canvas.height);
			this.ctx.lineTo(x, this.ctx.canvas.height - h);
			this.ctx.stroke();
		})
	}
}

function getBrightness(r, g, b) {
	return 0.299*r + 0.5876*g + 0.114*b
}

let ci;
let allGisto;
let redGisto;
let greenGisto;
let blueGisto;

document.getElementById("loadImage").addEventListener("change", (event) => {
	const imageURL = window.URL.createObjectURL(event.target.files[0])

	ci = new CanvasImage(document.getElementById('image'), imageURL)
	allGisto = new Gisto(document.getElementById('gistoAll'), ci, (r, g, b) => Math.round(getBrightness(r, g, b)))
	redGisto = new Gisto(document.getElementById('gistoRed'), ci, (r, g, b) => r, "red")
	greenGisto = new Gisto(document.getElementById('gistoGreen'), ci, (r, g, b) => g, "green")
	blueGisto = new Gisto(document.getElementById('gistoBlue'), ci, (r, g, b) => b, "blue")
})

document.getElementById('invert').addEventListener("click", () => {
	ci.transform((r, g, b) => {
		return [255 - r, 255 - g, 255 - b, 255];
	})
})

document.getElementById('gray').addEventListener("click", () => {
	ci.transform((r, g, b) => {
		const avg = (r + g + b) / 3;
		return [avg, avg, avg, 255];
	})
})

document.getElementById('binar').addEventListener("click", () => {
	const p = +document.getElementById('binarRange').value
	ci.transform((r, g, b) => {
		const y = getBrightness(r, g, b)

		return y <= p ? [0, 0, 0, 255] : [255, 255, 255, 255];
	})
})

document.getElementById('bright').addEventListener("click", () => {
	const p = +document.getElementById('brightRange').value
	ci.transform((r, g, b) => {
		return [
			Math.max(Math.min(r + p, 255), 0),
			Math.max(Math.min(g + p, 255), 0),
			Math.max(Math.min(b + p, 255), 0),
			255
		];
	})
})

document.getElementById('kontrast').addEventListener("click", () => {
	const p = +document.getElementById('kontrastRange').value / 50
	const avgBrightness = ci.getAvgBrightness()
	ci.transform((r, g, b) => {
		return [
			Math.max(Math.min(Math.round(p * (r - avgBrightness) + avgBrightness), 255), 0),
			Math.max(Math.min(Math.round(p * (g - avgBrightness) + avgBrightness), 255), 0),
			Math.max(Math.min(Math.round(p * (b - avgBrightness) + avgBrightness), 255), 0),
			255
		];
	})
})

document.getElementById('reset').addEventListener("click", () => {
	ci.reset()
})