
const PRICE=15000, PREPAY=0.30;
const form=document.getElementById('bookingForm');
const ids=['checkIn','checkOut','roomsCount','guests','name','phone'];
const el=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
const summary=document.getElementById('summary'), error=document.getElementById('error');
const today=new Date(); today.setHours(0,0,0,0); const iso=today.toISOString().slice(0,10); el.checkIn.min=iso; el.checkOut.min=iso;
function calc(){error.textContent=''; if(!el.checkIn.value||!el.checkOut.value){summary.textContent='Выберите даты для расчёта';return null} const a=new Date(el.checkIn.value+'T00:00:00'),b=new Date(el.checkOut.value+'T00:00:00'); const nights=Math.round((b-a)/86400000); const rooms=Number(el.roomsCount.value),guests=Number(el.guests.value); if(nights<1){error.textContent='Дата выезда должна быть позже даты заезда.';return null} if(rooms<1||rooms>20){error.textContent='Можно выбрать от 1 до 20 номеров.';return null} if(guests<1||guests>rooms*2){error.textContent='В одном номере может проживать не более 2 гостей.';return null} const total=nights*rooms*PRICE,prepay=Math.round(total*PREPAY); summary.innerHTML=`${nights} ноч. × ${rooms} ном. — <b>${total.toLocaleString('ru-RU')} ₸</b><br>Предоплата 30%: ${prepay.toLocaleString('ru-RU')} ₸`; return {nights,rooms,guests,total,prepay}}
['change','input'].forEach(evt=>form.addEventListener(evt,calc));
form.addEventListener('submit',e=>{e.preventDefault();const c=calc();if(!c)return;const msg=`Здравствуйте! Хочу забронировать Terekty Resort.%0A%0AИмя: ${encodeURIComponent(el.name.value)}%0AТелефон: ${encodeURIComponent(el.phone.value)}%0AЗаезд: ${el.checkIn.value}%0AВыезд: ${el.checkOut.value}%0AНомеров: ${c.rooms}%0AГостей: ${c.guests}%0AСтоимость: ${c.total.toLocaleString('ru-RU')} ₸%0AПредоплата 30%: ${c.prepay.toLocaleString('ru-RU')} ₸`;window.open('https://wa.me/77776433336?text='+msg,'_blank','noopener')});
