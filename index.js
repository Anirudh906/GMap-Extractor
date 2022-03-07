const puppeteer = require('puppeteer');
const express = require('express');
const app = express();

app.use(
    express.urlencoded({
        extended: true
    })
)

app.use(express.json())

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 300;
            var timer = setInterval(() => {
                const element = document.querySelectorAll('.section-scrollbox')[1];
                var scrollHeight = element.scrollHeight;
                element.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

async function autoScroll2(page) {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 300;
            var timer = setInterval(() => {
                const element = document.querySelectorAll('.Yr7JMd-pane.Yr7JMd-pane-visible')[2];
                var scrollHeight = element.scrollHeight;
                element.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}
// !Required: Name, avg rating, No. of Reviews, Image URL, category, desc, address, log, website, phone, status, openingHours, latitude, longitude, mapLink 
async function parsePlaces(page, page2) {
    await page2.bringToFront();
    let places = [];
    const placesURL = await page.evaluate(() => {
        let elements = Array.from(document.querySelectorAll(".section-scrollbox a"));
        let links = elements.map(element => {
            return element.href
        })
        return links;
    });
    console.log(placesURL);


    for (let i = 0; i < placesURL.length; i++) {

        await page2.goto(placesURL[i]);

        let place = {};

        let name = "";
        try {
            name = await page2.$eval(".gm2-headline-5 span", el => el.innerHTML);
            place.name = name;
        } catch (e) {
            console.log(e);
            place.name = "";
        }


        let rating = "";
        try {
            rating = await page2.$eval(".aMPvhf-fI6EEc-KVuj8d", el => el.innerHTML);
            place.rating = rating;
        } catch (e) {
            console.log(e);
            place.rating = "";
        }


        let reviews = "";
        try {
            reviews = await page2.$eval(".Yr7JMd-pane-hSRGPd", el => el.innerHTML);
            place.reviews = reviews;
        } catch (e) {
            console.log(e);
            place.reviews = "";
        }


        let typeOfStore = "";
        try {
            typeOfStore = await page2.$$eval(".gm2-body-2 .h0ySl-wcwwM-E70qVe .Yr7JMd-pane-hSRGPd", el => el[1].innerHTML);
            place.typeOfStore = typeOfStore;
        } catch (e) {
            console.log(e);
            place.typeOfStore = "";
        }


        let address = "";
        try {
            address = await page2.$eval("[aria-label^='Address'] .gm2-body-2", el => el.innerHTML);
            place.address = address;
        } catch (e) {
            console.log(e);
            place.address = "";
        }

        let imgURL = "";
        try {
            imgURL = await page2.$eval(".widget-pane-fade-in img", el => el.src);
            place.imageURL = imgURL;

        } catch (e) {
            console.log(e);
            place.imageURL = "";
        }



        let website = "";
        try {
            website = await page2.$eval("[aria-label^='Website'] .gm2-body-2", el => el.innerHTML);
            place.website = website;
        }
        catch (e) {
            console.log(e);
            place.website = "";
        }


        await autoScroll2(page2);

        let phoneNo = "";
        try {
            phoneNo = await page2.$eval("[aria-label^='Phone'] .gm2-body-2", el => el.innerHTML);
            place.phoneNo = phoneNo;
        } catch (e) {
            console.log(e);
            place.phoneNo = "";
        }



        let openingHours = "";
        try {
            openingHours = await page2.$$eval(".LJKBpe-Tswv1b-text", el => el[1].innerText);
            if (openingHours === "") openingHours = await page2.$$eval(".RcCsl.dqIYcf-RWgCYc-text.w4vB1d.w4vB1d-fZiSAe.AG25L.g9IHae -tPcied-d6wfac-jfdpUb .CsEnBe.QSFF4-text.gm2-body-2", el => el[1].innerText);
            place.openingHours = openingHours;
        } catch (e) {
            console.log(e);
            place.openingHours = "";
        }

        let log = "";
        try {
            log = await page2.$eval("[aria-label^='Plus code'] .gm2-body-2", el => el.innerHTML);
            place.log = log;
        } catch (e) {
            console.log(e);
            place.log = "";
        }


        let status = "";
        try {
            status = await page2.$$eval(".LJKBpe-Tswv1b-text", el => el[0].innerHTML);
            if (status === "") status = await page2.$$eval(".RcCsl.dqIYcf-RWgCYc-text.w4vB1d.w4vB1d-fZiSAe.AG25L.g9IHae -tPcied-d6wfac-jfdpUb .CsEnBe.QSFF4-text.gm2-body-2", el => el[1].innerText);
            place.status = status;
        } catch (e) {
            console.log(e);
            place.status = "";
        }

        let desc = "";
        try {
            desc = await page2.$eval(".uxOu9-sTGRBb-T3yXSc span", el => el.innerText);
            place.desc = desc;
        } catch (e) {
            console.log(e);
            place.desc = "";
        }



        places.push(place);
        console.log(place);
    }

    return places;
}

async function goToNextPage(page) {
    await page.click('button[aria-label=" Next page "]');
    await page.waitForNetworkIdle();
}

async function hasNextPage(page) {
    let element = await page.$('button[aria-label=" Next page "]');
    if (!element) {
        throw new Error('Next page element is not found');
    }

    const disabled = await page.evaluate((el) => el.getAttribute('disabled'), element);
    if (disabled) {
        console.log('The next page button is disabled');
    }

    return !disabled;
}

app.post('/', (req, res) => {

    const { url, pages } = req.body;

    (async () => {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        const page2 = await browser.newPage();
        await page.goto(url);

        await page.setViewport({
            width: 1300,
            height: 900
        });
        await page2.setViewport({
            width: 1300,
            height: 900
        });
        await page.bringToFront();
        let places = [];
        let countOfPages = 0;
        do {
            countOfPages++;
            if (countOfPages > pages) break;
            await autoScroll(page);
            places = places.concat(await parsePlaces(page, page2));
            console.log('Parsed ' + places.length + ' places');
            await page.bringToFront();
            await autoScroll(page);
            await goToNextPage(page);
        } while (await hasNextPage(page))
        res.send(places);
    })();

});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
