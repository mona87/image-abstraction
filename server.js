const express = require('express');
const Flickr = require('flickr-sdk');
const mongoose = require('mongoose');
const app = express();

mongoose.connect(process.env.MONGOLAB_FLICKR_URI);


const model = mongoose.Schema({
	term: String,
	when: String,
})

const Search = mongoose.model('Search', model);


const flickr = new Flickr({
	"apiKey": process.env.FLICKR_API_KEY,
	"secret": process.env.FLICKR_SECRET,	
	"accessToken": process.env.FLICKR_ACCESS_TOKEN,
	"accessTokenSecret": process.env.FLICKR_ACCESS_SECRET,
});

//get recent searches
app.get('/api/latest/imagesearch', (req,res) => {
	Search.find({}, 'term when -_id', (err, result ) => {
		if(err){
			res.send({error: err})
		} else{
			res.send(result);
		}
	})
})

app.get('/api/imagesearch/:param/:offset?', (req, res) => {
		let param = req.params.param;
		let offset = parseInt(req.query.offset) || 20;

	flickr
	.request()
	.media()
	.search(param)
	.get({
		media: 'photos',
		per_page: offset
	 })
	.then(result => {
		const format = [];
		//format json 
		let photo = result.body.photos.photo;
		for(let i = 0; i < offset; i++){
					// console.log('p',photo[i])
			format.push({
				url: `https://farm${ photo[i].farm}.staticflickr.com/${photo[i].server}/${photo[i].id}_${photo[i].secret}.jpg`,
				snippet: photo[i].title,
				thumbnail: `https://farm${ photo[i].farm}.staticflickr.com/${photo[i].server}/${photo[i].id}_${photo[i].secret}_t.jpg`,
				context: `https://www.flickr.com/photos/${photo[i].owner}/${photo[i].id}`,
			})
		}
		//add search to database
		const time = new Date();
		const timestamp = time.toISOString();
		let newSearch = new Search({
			term: param,
			when: timestamp,
		})
		newSearch.save();

		res.send(format)
	}, err =>{
		res.send({error: err})
	});

});


app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", () => {
	console.log('app listening on 3000')
});